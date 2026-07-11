import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CocoaQualityGrade, PurchaseStatus, BeneficiaryType } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto, userId: string) {
    // 1. Calcul du numéro d'achat automatique
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').substring(0, 6); // YYYYMM
    const count = await this.prisma.purchase.count({
      where: { purchaseNumber: { startsWith: `ACH-${dateStr}` } },
    });
    const seq = (count + 1).toString().padStart(4, '0');
    const purchaseNumber = `ACH-${dateStr}-${seq}`;

    // 2. Calcul du Poids Net
    const weightNet = dto.weightGross - dto.weightBags;
    if (weightNet <= 0) {
      throw new BadRequestException("Le poids net doit être supérieur à 0.");
    }

    // 3. Calcul des Réfactions (Humidité et Impuretés)
    let refactionMoisture = 0;
    if (dto.moistureRate > 8.0) {
      if (dto.moistureRate <= 10.0) {
        refactionMoisture = weightNet * (dto.moistureRate - 8.0) / 100.0;
      } else {
        refactionMoisture = weightNet * ((dto.moistureRate - 8.0) * 2.0) / 100.0;
      }
    }

    let refactionImpurity = 0;
    if (dto.impurityRate > 1.0) {
      refactionImpurity = weightNet * (dto.impurityRate - 1.0) / 100.0;
    }

    const weightRefactionKg = refactionMoisture + refactionImpurity;
    const weightNetPaid = Math.max(0, weightNet - weightRefactionKg);

    // 4. Détermination de la Qualité (Grade)
    let qualityGrade: CocoaQualityGrade = CocoaQualityGrade.SOUS_GRADE;
    if (dto.moistureRate <= 8.0 && dto.impurityRate <= 1.0 && dto.grainage <= 100) {
      qualityGrade = CocoaQualityGrade.GRADE_1;
    } else if (dto.moistureRate <= 9.0 && dto.impurityRate <= 2.0 && dto.grainage <= 110) {
      qualityGrade = CocoaQualityGrade.GRADE_2;
    }

    // 5. Calcul des Montants Financiers
    const amountGross = weightNetPaid * dto.pricePerKg;

    // 6. Détection et application automatique de déduction de crédit
    let creditDeduction = 0;
    let selectedCreditId: string | null = null;

    if (dto.planterId) {
      // Trouver un crédit actif pour ce planteur
      const activeCredit = await this.prisma.credit.findFirst({
        where: {
          planterId: dto.planterId,
          status: { in: ['ACTIVE', 'OVERDUE'] },
        },
        orderBy: { dueDate: 'asc' }, // premier arrivé, premier remboursé
      });

      if (activeCredit) {
        selectedCreditId = activeCredit.id;
        // Règle par défaut : déduire max 50% du montant brut de la récolte
        const maxDeductionAllowed = amountGross * 0.5;
        creditDeduction = Math.min(Number(activeCredit.balance), maxDeductionAllowed);
      }
    }

    const amountNetPaid = amountGross - creditDeduction;

    // 7. Enregistrement en base de données
    const purchase = await this.prisma.purchase.create({
      data: {
        purchaseNumber,
        status: PurchaseStatus.PENDING_PAYMENT,
        planterId: dto.planterId,
        subBuyerId: dto.subBuyerId,
        buyerId: userId,
        storeId: dto.storeId,
        campaign: dto.campaign,
        lotNumber: dto.lotNumber,
        bagCount: dto.bagCount,
        packagingType: dto.packagingType,
        qualityGrade,
        weightGross: dto.weightGross,
        weightBags: dto.weightBags,
        weightNet,
        moistureRate: dto.moistureRate,
        impurityRate: dto.impurityRate,
        moldyRate: dto.moldyRate,
        slatyRate: dto.slatyRate,
        insectRate: dto.insectRate,
        grainage: dto.grainage,
        weightRefactionKg,
        weightNetPaid,
        pricePerKg: dto.pricePerKg,
        amountGross,
        creditDeduction,
        amountNetPaid,
        scaleModel: dto.scaleModel,
        scaleSerialNumber: dto.scaleSerialNumber,
      },
      include: { planter: true, store: true },
    });

    // 8. Création du mouvement de stock (entrée RESERVE / PENDING)
    await this.prisma.stockMovement.create({
      data: {
        storeId: dto.storeId,
        quantityKg: weightNet,
        bagCount: dto.bagCount,
        type: 'PURCHASE',
        referenceId: purchase.id,
        createdById: userId,
      },
    });

    // Si un crédit est déduit, on pré-crée l'AutoDeduction
    if (selectedCreditId && creditDeduction > 0) {
      await this.prisma.autoDeduction.create({
        data: {
          creditId: selectedCreditId,
          purchaseId: purchase.id,
          amountDeducted: creditDeduction,
        },
      });
    }

    return purchase;
  }

  async validatePayment(id: string, userId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { deductions: true },
    });
    if (!purchase) throw new NotFoundException("Achat introuvable.");

    if (purchase.status !== PurchaseStatus.PENDING_PAYMENT) {
      throw new BadRequestException("Cet achat n'est pas en attente de paiement.");
    }

    // Valider le paiement de l'achat
    const updated = await this.prisma.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.PAID },
    });

    // Appliquer réellement les remboursements de crédits s'ils ont été retenus
    if (purchase.creditDeduction > 0) {
      // Trouver l'auto-déduction pré-créée
      const deduction = await this.prisma.autoDeduction.findFirst({
        where: { purchaseId: id },
      });

      if (deduction) {
        const credit = await this.prisma.credit.findUnique({
          where: { id: deduction.creditId },
        });

        if (credit) {
          const newAmountRepaid = Number(credit.amountRepaid) + Number(deduction.amountDeducted);
          const newBalance = Number(credit.balance) - Number(deduction.amountDeducted);
          const newStatus = newBalance <= 0 ? 'REPAID' : credit.status;

          // Mettre à jour le crédit
          await this.prisma.credit.update({
            where: { id: credit.id },
            data: {
              amountRepaid: newAmountRepaid,
              balance: newBalance,
              status: newStatus,
            },
          });

          // Créer un remboursement formel pour l'historique
          await this.prisma.repayment.create({
            data: {
              creditId: credit.id,
              amount: deduction.amountDeducted,
              repaidAt: new Date(),
              paymentMethod: 'CASH',
              userId,
              isAuto: true,
              observations: `Déduction automatique lors de l'achat ${purchase.purchaseNumber}`,
            },
          });
        }
      }
    }

    return updated;
  }

  async getStats() {
    const purchases = await this.prisma.purchase.findMany();

    const totalWeight = purchases.reduce((sum, p) => sum + p.weightNetPaid, 0);
    const totalAmount = purchases.reduce((sum, p) => sum + p.amountGross, 0);

    const grade1 = purchases.filter(p => p.qualityGrade === CocoaQualityGrade.GRADE_1).length;
    const grade2 = purchases.filter(p => p.qualityGrade === CocoaQualityGrade.GRADE_2).length;
    const subGrade = purchases.filter(p => p.qualityGrade === CocoaQualityGrade.SOUS_GRADE).length;

    return {
      totalWeight,
      totalAmount,
      gradeDistribution: [
        { name: 'Grade 1', value: grade1 },
        { name: 'Grade 2', value: grade2 },
        { name: 'Sous-Grade', value: subGrade },
      ],
      totalCount: purchases.length,
    };
  }

  async findAll(query: any) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.planterId) {
      where.planterId = query.planterId;
    }
    if (query.subBuyerId) {
      where.subBuyerId = query.subBuyerId;
    }

    return this.prisma.purchase.findMany({
      where,
      include: { planter: true, subBuyer: true, store: true, buyer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { planter: true, subBuyer: true, store: true, buyer: true, deductions: { include: { credit: true } } },
    });
    if (!purchase) throw new NotFoundException("Achat introuvable.");
    return purchase;
  }
}
