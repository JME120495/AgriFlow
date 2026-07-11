import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQualityControlDto } from './dto/create-quality-control.dto';
import { UpdateRuleDto } from './dto/update-rules.dto';
import { QualityControlStatus, RefactionPenaltyType } from '@prisma/client';

@Injectable()
export class QualityControlsService {
  constructor(private prisma: PrismaService) {}

  // Helper pour évaluer de manière sécurisée les formules de réfaction
  private evaluateFormula(formula: string, metrics: any): number {
    try {
      let expr = formula;
      for (const [key, val] of Object.entries(metrics)) {
        const regex = new RegExp(`metrics\\.${key}`, 'g');
        expr = expr.replace(regex, String(val));
      }
      // Nettoyage de l'expression pour n'autoriser que les calculs mathématiques et ternaires de base
      if (!/^[0-9a-zA-Z\s\+\-\*\/\?\:\(\)\.\>\<=\!]+$/.test(expr)) {
        throw new Error("Formule invalide ou dangereuse");
      }
      const fn = new Function(`return (${expr});`);
      const res = fn();
      return typeof res === 'number' && !isNaN(res) ? res : 0;
    } catch (err) {
      console.error("[QualityControlsService] Erreur d'évaluation de la formule:", err);
      return 0;
    }
  }

  // Résoudre la règle la plus spécifique
  async findApplicableRule(code: string, campaign: string, storeId: string, clientExport?: string) {
    // 1. Recherche par clientExport + campaign + storeId
    let rule = await this.prisma.refactionRule.findFirst({
      where: { code, campaign, storeId, clientExport, isActive: true },
    });
    if (rule) return rule;

    // 2. Recherche par campaign + storeId (sans client export)
    rule = await this.prisma.refactionRule.findFirst({
      where: { code, campaign, storeId, clientExport: null, isActive: true },
    });
    if (rule) return rule;

    // 3. Recherche par campaign + clientExport (sans storeId)
    if (clientExport) {
      rule = await this.prisma.refactionRule.findFirst({
        where: { code, campaign, storeId: null, clientExport, isActive: true },
      });
      if (rule) return rule;
    }

    // 4. Recherche par campaign uniquement
    rule = await this.prisma.refactionRule.findFirst({
      where: { code, campaign, storeId: null, clientExport: null, isActive: true },
    });
    if (rule) return rule;

    // 5. Règle globale par défaut
    rule = await this.prisma.refactionRule.findFirst({
      where: { code, campaign: null, storeId: null, clientExport: null, isActive: true },
    });
    return rule;
  }

  async create(dto: CreateQualityControlDto, userId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: dto.purchaseId },
      include: { store: true },
    });

    if (!purchase) {
      throw new NotFoundException("Achat non trouvé");
    }

    // Récupérer le nom du client d'export si disponible
    const clientExport = purchase.lotNumber || undefined; // Dans AgriFlow, lotNumber ou un champ similaire peut porter le client

    const metrics = {
      moistureRate: dto.moistureRate,
      impurityRate: dto.impurityRate,
      moldyRate: dto.moldyRate,
      slatyRate: dto.slatyRate,
      insectRate: dto.insectRate,
      brokenRate: dto.brokenRate,
      flatRate: dto.flatRate,
      germinatedRate: dto.germinatedRate,
      wetBagsCount: dto.wetBagsCount || 0,
    };

    let weightRefactionKg = 0;
    let shouldValidateSup = false;
    let isRejected = false;

    // Récupérer et appliquer les règles actives en base de données
    const ruleCodes = ['HUMIDITE', 'DECHETS', 'MOISIES', 'ARDOISED', 'INSECTE', 'CASSEES', 'PLATES', 'GERMEES'];
    for (const code of ruleCodes) {
      const rule = await this.findApplicableRule(code, purchase.campaign, purchase.storeId, clientExport);
      if (!rule) continue;

      const val = metrics[this.getMetricKeyByCode(code)];
      if (val === undefined) continue;

      if (val > rule.threshold) {
        // Vérifier si dépassement de la limite critique
        if (rule.maxLimit && val > rule.maxLimit) {
          shouldValidateSup = true;
          if (rule.penaltyType === RefactionPenaltyType.REJECT) {
            isRejected = true;
          }
        }

        // Calcul de la pénalité
        let penaltyAmount = 0;
        if (rule.formula) {
          penaltyAmount = this.evaluateFormula(rule.formula, metrics);
        } else {
          // Calcul standard linéaire par défaut
          penaltyAmount = (val - rule.threshold) * rule.penaltyValue;
        }

        if (rule.penaltyType === RefactionPenaltyType.PERCENT_WEIGHT) {
          weightRefactionKg += purchase.weightNet * (penaltyAmount / 100);
        } else if (rule.penaltyType === RefactionPenaltyType.WEIGHT_KG) {
          weightRefactionKg += penaltyAmount;
        }
      }
    }

    // Réfaction sacs humides
    if (dto.wetBagsCount && dto.wetBagsCount > 0) {
      weightRefactionKg += dto.wetBagsCount * 1.5; // 1.5kg par sac humide
    }

    weightRefactionKg = Math.min(weightRefactionKg, purchase.weightNet);
    const weightNetPaid = Math.max(0, purchase.weightNet - weightRefactionKg);
    const amountGross = weightNetPaid * purchase.pricePerKg;

    // Déterminer le grade
    let qualityGrade: 'GRADE_1' | 'GRADE_2' | 'SOUS_GRADE' = 'GRADE_1';
    if (dto.moistureRate > 9.0 || dto.impurityRate > 2.0 || dto.moldyRate > 4.0) {
      qualityGrade = 'SOUS_GRADE';
    } else if (dto.moistureRate > 8.0 || dto.impurityRate > 1.0 || dto.moldyRate > 3.0) {
      qualityGrade = 'GRADE_2';
    }

    // Déterminer le statut initial
    let status: QualityControlStatus = QualityControlStatus.VALIDATED;
    if (isRejected) {
      status = QualityControlStatus.REJECTED;
    } else if (shouldValidateSup) {
      status = QualityControlStatus.PENDING_VALIDATION;
    }

    // Générer le numéro de contrôle
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await this.prisma.qualityControl.count();
    const controlNumber = `QC-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Transaction Prisma pour créer le contrôle et mettre à jour l'achat
    const result = await this.prisma.$transaction(async (tx) => {
      const qc = await tx.qualityControl.create({
        data: {
          controlNumber,
          status,
          purchaseId: purchase.id,
          moistureRate: dto.moistureRate,
          impurityRate: dto.impurityRate,
          moldyRate: dto.moldyRate,
          slatyRate: dto.slatyRate,
          insectRate: dto.insectRate,
          brokenRate: dto.brokenRate,
          flatRate: dto.flatRate,
          germinatedRate: dto.germinatedRate,
          grainage: dto.grainage,
          wetBagsCount: dto.wetBagsCount || 0,
          smell: dto.smell || 'CONFORME',
          color: dto.color || 'CONFORME',
          bagCondition: dto.bagCondition || 'PROPRE',
          observations: dto.observations,
          weightRefactionKg,
          financialLossFCFA: weightRefactionKg * purchase.pricePerKg,
          controlledById: userId,
          validatedById: status === QualityControlStatus.VALIDATED ? userId : null,
        },
      });

      await tx.qualityControlHistory.create({
        data: {
          qualityControlId: qc.id,
          statusBefore: QualityControlStatus.DRAFT,
          statusAfter: status,
          userId,
          comment: "Création initiale du contrôle qualité",
        },
      });

      // Si validé ou en attente, on met à jour les poids et les montants de l'achat
      const updateData: any = {
        moistureRate: dto.moistureRate,
        impurityRate: dto.impurityRate,
        moldyRate: dto.moldyRate,
        slatyRate: dto.slatyRate,
        insectRate: dto.insectRate,
        grainage: dto.grainage,
        weightRefactionKg,
        weightNetPaid,
        amountGross,
        qualityGrade,
      };

      if (status === QualityControlStatus.REJECTED) {
        updateData.status = 'CANCELLED';
      }

      await tx.purchase.update({
        where: { id: purchase.id },
        data: updateData,
      });

      return qc;
    });

    return result;
  }

  async validate(id: string, userId: string, comment?: string) {
    const qc = await this.prisma.qualityControl.findUnique({
      where: { id },
      include: { purchase: true },
    });

    if (!qc) {
      throw new NotFoundException("Contrôle qualité non trouvé");
    }

    if (qc.status !== QualityControlStatus.PENDING_VALIDATION) {
      throw new BadRequestException("Ce contrôle qualité n'est pas en attente de validation");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedQc = await tx.qualityControl.update({
        where: { id },
        data: {
          status: QualityControlStatus.VALIDATED,
          validatedById: userId,
        },
      });

      await tx.qualityControlHistory.create({
        data: {
          qualityControlId: qc.id,
          statusBefore: qc.status,
          statusAfter: QualityControlStatus.VALIDATED,
          userId,
          comment: comment || "Approbation par le responsable",
        },
      });

      return updatedQc;
    });
  }

  async reject(id: string, userId: string, comment?: string) {
    const qc = await this.prisma.qualityControl.findUnique({
      where: { id },
      include: { purchase: true },
    });

    if (!qc) {
      throw new NotFoundException("Contrôle qualité non trouvé");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedQc = await tx.qualityControl.update({
        where: { id },
        data: {
          status: QualityControlStatus.REJECTED,
        },
      });

      await tx.qualityControlHistory.create({
        data: {
          qualityControlId: qc.id,
          statusBefore: qc.status,
          statusAfter: QualityControlStatus.REJECTED,
          userId,
          comment: comment || "Rejet du contrôle qualité",
        },
      });

      // Annuler l'achat
      await tx.purchase.update({
        where: { id: qc.purchaseId },
        data: { status: 'CANCELLED' },
      });

      return updatedQc;
    });
  }

  async findAll() {
    return this.prisma.qualityControl.findMany({
      include: {
        purchase: {
          include: {
            planter: true,
            store: true,
          },
        },
        controlledBy: true,
        validatedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const qc = await this.prisma.qualityControl.findUnique({
      where: { id },
      include: {
        purchase: {
          include: {
            planter: true,
            store: true,
          },
        },
        controlledBy: true,
        validatedBy: true,
        histories: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!qc) {
      throw new NotFoundException("Contrôle qualité non trouvé");
    }
    return qc;
  }

  async getRules() {
    return this.prisma.refactionRule.findMany({
      include: { store: true },
      orderBy: [{ campaign: 'desc' }, { code: 'asc' }],
    });
  }

  async updateRule(dto: UpdateRuleDto) {
    // Trouver si une règle identique existe
    const existing = await this.prisma.refactionRule.findFirst({
      where: {
        code: dto.code,
        campaign: dto.campaign || null,
        storeId: dto.storeId || null,
        clientExport: dto.clientExport || null,
      },
    });

    if (existing) {
      return this.prisma.refactionRule.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          threshold: dto.threshold,
          penaltyType: dto.penaltyType,
          penaltyValue: dto.penaltyValue,
          formula: dto.formula || null,
          maxLimit: dto.maxLimit || null,
        },
      });
    } else {
      return this.prisma.refactionRule.create({
        data: {
          code: dto.code,
          name: dto.name,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          threshold: dto.threshold,
          penaltyType: dto.penaltyType,
          penaltyValue: dto.penaltyValue,
          formula: dto.formula || null,
          maxLimit: dto.maxLimit || null,
          campaign: dto.campaign || null,
          storeId: dto.storeId || null,
          clientExport: dto.clientExport || null,
        },
      });
    }
  }

  private getMetricKeyByCode(code: string): string {
    switch (code) {
      case 'HUMIDITE': return 'moistureRate';
      case 'DECHETS': return 'impurityRate';
      case 'MOISIES': return 'moldyRate';
      case 'ARDOISED': return 'slatyRate';
      case 'INSECTE': return 'insectRate';
      case 'CASSEES': return 'brokenRate';
      case 'PLATES': return 'flatRate';
      case 'GERMEES': return 'germinatedRate';
      default: return '';
    }
  }
}
