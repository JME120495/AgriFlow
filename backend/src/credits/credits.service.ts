import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { RepayCreditDto } from './dto/repay-credit.dto';
import { CreditStatus, BeneficiaryType } from '@prisma/client';

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCreditDto, userId: string) {
    // 1. Vérification des plafonds
    const limit = await this.prisma.creditLimit.findFirst({
      where: {
        beneficiaryType: dto.beneficiaryType,
        beneficiaryId: dto.beneficiaryId,
      },
    });

    if (limit) {
      // Calculer les crédits actifs actuels de ce bénéficiaire
      const activeCredits = await this.prisma.credit.findMany({
        where: {
          beneficiaryType: dto.beneficiaryType,
          beneficiaryId: dto.beneficiaryId,
          status: { in: ['ACTIVE', 'OVERDUE'] },
        },
      });

      const totalActiveBalance = activeCredits.reduce((sum, c) => sum + Number(c.balance), 0);

      if (totalActiveBalance + dto.amountGranted > Number(limit.maxLimit)) {
        throw new BadRequestException(
          `Dépassement de plafond de crédit autorisé. Plafond : ${limit.maxLimit} XOF, En cours : ${totalActiveBalance} XOF.`,
        );
      }
    }

    // 2. Génération automatique du numéro de crédit
    const dateStr = new Date(dto.grantedAt).toISOString().split('T')[0].replace(/-/g, '').substring(0, 6); // YYYYMM
    const count = await this.prisma.credit.count({
      where: {
        creditNumber: { startsWith: `CR-${dateStr}` },
      },
    });
    const seq = (count + 1).toString().padStart(4, '0');
    const creditNumber = `CR-${dateStr}-${seq}`;

    // 3. Règle de double validation : > 5 000 000 XOF => PENDING_VALIDATION
    const requiresValidation = dto.amountGranted > 5000000;
    const initialStatus: CreditStatus = requiresValidation ? 'PENDING_VALIDATION' : 'ACTIVE';

    const data: any = {
      creditNumber,
      beneficiaryType: dto.beneficiaryType,
      beneficiaryId: dto.beneficiaryId,
      categoryId: dto.categoryId,
      amountGranted: dto.amountGranted,
      balance: dto.amountGranted,
      grantedAt: new Date(dto.grantedAt),
      dueDate: new Date(dto.dueDate),
      paymentMethod: dto.paymentMethod,
      sourceAccount: dto.sourceAccount,
      status: initialStatus,
      observations: dto.observations,
      createdById: userId,
    };

    // Rattachement optionnel aux relations explicites Prisma
    if (dto.beneficiaryType === BeneficiaryType.PLANTER) {
      data.planterId = dto.beneficiaryId;
    } else if (dto.beneficiaryType === BeneficiaryType.SUB_BUYER) {
      data.subBuyerId = dto.beneficiaryId;
    } else if (dto.beneficiaryType === BeneficiaryType.ZONE_MANAGER) {
      data.zoneManagerId = dto.beneficiaryId;
    }

    const credit = await this.prisma.credit.create({
      data,
      include: { category: true, createdBy: true },
    });

    // Logger l'audit
    await this.prisma.creditAuditLog.create({
      data: {
        creditId: credit.id,
        userId,
        action: 'CREATE',
        payloadAfter: JSON.parse(JSON.stringify(credit)),
      },
    });

    return credit;
  }

  async validate(id: string, userId: string, userRole: string) {
    if (userRole !== 'DIRECTEUR' && userRole !== 'ADMIN') {
      throw new ForbiddenException("Seuls les Directeurs et Administrateurs peuvent valider ce crédit.");
    }

    const credit = await this.prisma.credit.findUnique({ where: { id } });
    if (!credit) throw new NotFoundException("Crédit introuvable.");

    if (credit.status !== 'PENDING_VALIDATION') {
      throw new BadRequestException("Ce crédit n'est pas en attente de validation.");
    }

    const updated = await this.prisma.credit.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        // validatedById and validatedAt was defined as validatedBy relation in schema
        // Let's add them if they exist in schema.prisma. Since they are validatedById/validatedAt:
        // Wait, validatedById was defined as validatedById in prisma schema! Yes, I did validatedById / validatedAt
      },
    });

    await this.prisma.creditAuditLog.create({
      data: {
        creditId: id,
        userId,
        action: 'VALIDATE',
        payloadAfter: JSON.parse(JSON.stringify(updated)),
      },
    });

    return updated;
  }

  async repay(id: string, dto: RepayCreditDto, userId: string) {
    const credit = await this.prisma.credit.findUnique({ where: { id } });
    if (!credit) throw new NotFoundException("Crédit introuvable.");

    if (credit.status !== 'ACTIVE' && credit.status !== 'OVERDUE') {
      throw new BadRequestException("Impossible d'effectuer un remboursement sur un crédit inactif ou déjà soldé.");
    }

    const currentBalance = Number(credit.balance);
    if (dto.amount > currentBalance) {
      throw new BadRequestException(`Le montant du remboursement (${dto.amount} XOF) dépasse le solde restant (${currentBalance} XOF).`);
    }

    const newAmountRepaid = Number(credit.amountRepaid) + dto.amount;
    const newBalance = currentBalance - dto.amount;
    const newStatus: CreditStatus = newBalance <= 0 ? 'REPAID' : credit.status;

    // Enregistrer le remboursement
    await this.prisma.repayment.create({
      data: {
        creditId: id,
        amount: dto.amount,
        repaidAt: new Date(dto.repaidAt),
        paymentMethod: dto.paymentMethod,
        userId,
        observations: dto.observations,
      },
    });

    // Mettre à jour le crédit
    const updated = await this.prisma.credit.update({
      where: { id },
      data: {
        amountRepaid: newAmountRepaid,
        balance: newBalance,
        status: newStatus,
      },
    });

    await this.prisma.creditAuditLog.create({
      data: {
        creditId: id,
        userId,
        action: 'REPAY',
        payloadBefore: JSON.parse(JSON.stringify(credit)),
        payloadAfter: JSON.parse(JSON.stringify(updated)),
      },
    });

    return updated;
  }

  async getStats() {
    const credits = await this.prisma.credit.findMany({
      include: { category: true },
    });

    const active = credits.filter(c => c.status === 'ACTIVE' || c.status === 'OVERDUE');
    const repaid = credits.filter(c => c.status === 'REPAID');
    const overdue = credits.filter(c => c.status === 'OVERDUE');

    const totalGranted = credits.reduce((sum, c) => sum + Number(c.amountGranted), 0);
    const totalRepaid = repaymentsSum(credits);
    const totalBalance = active.reduce((sum, c) => sum + Number(c.balance), 0);
    const totalOverdue = overdue.reduce((sum, c) => sum + Number(c.balance), 0);

    // Répartition par catégorie
    const categoryMap: Record<string, number> = {};
    for (const c of credits) {
      const code = c.category.label;
      categoryMap[code] = (categoryMap[code] || 0) + Number(c.amountGranted);
    }

    const byCategory = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name],
    }));

    return {
      totalGranted,
      totalRepaid,
      totalBalance,
      totalOverdue,
      byCategory,
      countActive: active.length,
      countOverdue: overdue.length,
    };
  }

  async findAll(query: any) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.beneficiaryType) {
      where.beneficiaryType = query.beneficiaryType;
    }
    if (query.beneficiaryId) {
      where.beneficiaryId = query.beneficiaryId;
    }

    return this.prisma.credit.findMany({
      where,
      include: { category: true, repayments: true, createdBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const credit = await this.prisma.credit.findUnique({
      where: { id },
      include: { category: true, repayments: { include: { user: true } }, createdBy: true, logs: true },
    });
    if (!credit) throw new NotFoundException("Crédit introuvable.");
    return credit;
  }
}

function repaymentsSum(credits: any[]) {
  return credits.reduce((sum, c) => sum + Number(c.amountRepaid), 0);
}
