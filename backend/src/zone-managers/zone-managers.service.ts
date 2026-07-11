import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZoneManagersService {
  constructor(private prisma: PrismaService) {}

  // Log Audit Helper
  private async logAudit(userId: string, action: string, details: any) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        module: 'zone-managers',
        details,
        ipAddress: '127.0.0.1',
        userAgent: 'Internal System',
      },
    });
  }

  // 1. Creer un profil de chef de zone
  async create(dto: any, auditUserId: string) {
    if (!dto.userId) {
      throw new BadRequestException("L'identifiant de l'utilisateur (userId) est requis.");
    }

    // Verifier si l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException("L'utilisateur spécifié n'existe pas.");
    }

    if (user.role.name !== 'CHEF_DE_ZONE') {
      throw new BadRequestException("L'utilisateur spécifié n'a pas le rôle CHEF_DE_ZONE.");
    }

    // Verifier si le profil existe deja
    const existingProfile = await this.prisma.zoneManagerProfile.findUnique({
      where: { userId: dto.userId },
    });

    if (existingProfile) {
      throw new ConflictException("Un profil de chef de zone existe déjà pour cet utilisateur.");
    }

    const profile = await this.prisma.zoneManagerProfile.create({
      data: {
        userId: dto.userId,
        gender: dto.gender || 'M',
        photoUrl: dto.photoUrl || null,
        phoneSecondary: dto.phoneSecondary || null,
        recruitmentDate: dto.recruitmentDate ? new Date(dto.recruitmentDate) : new Date(),
        status: 'ACTIVE',
      },
    });

    await this.logAudit(auditUserId, 'CREATE_ZONE_MANAGER_PROFILE', { profileId: profile.id, userId: dto.userId });

    return profile;
  }

  // 2. Affecter une zone geographique
  async assignZone(profileId: string, dto: any, auditUserId: string) {
    if (!dto.zoneId) {
      throw new BadRequestException("L'identifiant de la zone (zoneId) est requis.");
    }

    const profile = await this.prisma.zoneManagerProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) {
      throw new NotFoundException("Le profil du chef de zone n'existe pas.");
    }

    const zone = await this.prisma.geographicZone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new NotFoundException("La zone géographique spécifiée n'existe pas.");
    }

    // Verifier si la zone est deja attribuee a un autre chef de zone actif
    const activeAssignment = await this.prisma.zoneAssignment.findFirst({
      where: {
        zoneId: dto.zoneId,
        isActive: true,
        managerId: { not: profileId },
      },
      include: {
        manager: {
          include: { user: true },
        },
      },
    });

    if (activeAssignment && !dto.specialPermission) {
      const managerName = `${activeAssignment.manager.user.firstName} ${activeAssignment.manager.user.lastName}`;
      throw new ConflictException(`La zone est déjà attribuée activement à ${managerName}. Une autorisation spéciale est requise.`);
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      // Si pas d'autorisation speciale, desactiver les affectations precedentes pour cette zone
      if (!dto.specialPermission) {
        await tx.zoneAssignment.updateMany({
          where: { zoneId: dto.zoneId, isActive: true },
          data: { isActive: false, revokedAt: new Date() },
        });
      }

      // Creer la nouvelle affectation
      const newAssignment = await tx.zoneAssignment.create({
        data: {
          zoneId: dto.zoneId,
          managerId: profileId,
          isActive: true,
          specialPermission: dto.specialPermission || false,
          notes: dto.notes || null,
        },
      });

      // Mettre a jour le manager actuel sur la zone
      await tx.geographicZone.update({
        where: { id: dto.zoneId },
        data: { currentManagerId: profileId },
      });

      return newAssignment;
    });

    await this.logAudit(auditUserId, 'ASSIGN_ZONE', { profileId, zoneId: dto.zoneId, assignmentId: assignment.id });

    return assignment;
  }

  // 3. Retirer une zone geographique (desaffecter)
  async removeZone(profileId: string, zoneId: string, auditUserId: string) {
    const assignment = await this.prisma.zoneAssignment.findFirst({
      where: {
        zoneId,
        managerId: profileId,
        isActive: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException("Aucune affectation active trouvée pour ce chef de zone et cette zone.");
    }

    await this.prisma.$transaction(async (tx) => {
      // Desactiver l'affectation
      await tx.zoneAssignment.update({
        where: { id: assignment.id },
        data: {
          isActive: false,
          revokedAt: new Date(),
        },
      });

      // Retirer le manager actuel sur la zone
      await tx.geographicZone.update({
        where: { id: zoneId },
        data: { currentManagerId: null },
      });
    });

    await this.logAudit(auditUserId, 'REVOKE_ZONE_ASSIGNMENT', { profileId, zoneId, assignmentId: assignment.id });

    return { message: "Zone retirée avec succès." };
  }

  // 4. Rattacher un sous-acheteur (pisteur)
  async attachSubBuyer(profileId: string, dto: any, auditUserId: string) {
    if (!dto.subBuyerId) {
      throw new BadRequestException("L'identifiant du sous-acheteur (subBuyerId) est requis.");
    }

    const profile = await this.prisma.zoneManagerProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });
    if (!profile) {
      throw new NotFoundException("Le profil du chef de zone n'existe pas.");
    }

    const subBuyer = await this.prisma.user.findUnique({
      where: { id: dto.subBuyerId },
      include: { role: true },
    });

    if (!subBuyer || subBuyer.role.name !== 'SOUS_ACHETEUR') {
      throw new BadRequestException("L'utilisateur spécifié n'existe pas ou n'est pas un sous-acheteur.");
    }

    // Rattacher en mettant a jour le managerId de l'utilisateur
    const updatedSubBuyer = await this.prisma.user.update({
      where: { id: dto.subBuyerId },
      data: { managerId: profile.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        managerId: true,
      },
    });

    await this.logAudit(auditUserId, 'ATTACH_SUB_BUYER', { profileId, subBuyerId: dto.subBuyerId });

    return updatedSubBuyer;
  }

  // 5. Definir des objectifs
  async defineObjective(profileId: string, dto: any, auditUserId: string) {
    const profile = await this.prisma.zoneManagerProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) {
      throw new NotFoundException("Le profil du chef de zone n'existe pas.");
    }

    if (!dto.period || !dto.startDate || !dto.endDate) {
      throw new BadRequestException("Les champs period, startDate, et endDate sont requis.");
    }

    const objective = await this.prisma.zoneObjective.create({
      data: {
        managerId: profileId,
        period: dto.period,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        targetQuantityKg: parseFloat(dto.targetQuantityKg || 0),
        targetValueFCFA: parseFloat(dto.targetValueFCFA || 0),
        targetActivePlanters: parseInt(dto.targetActivePlanters || 0, 10),
        targetNewPlanters: parseInt(dto.targetNewPlanters || 0, 10),
        targetRepaymentFCFA: parseFloat(dto.targetRepaymentFCFA || 0),
      },
    });

    await this.logAudit(auditUserId, 'DEFINE_ZONE_OBJECTIVE', { profileId, objectiveId: objective.id });

    return objective;
  }

  // 6. Suivre l'atteinte des objectifs
  async getObjectives(profileId: string) {
    const objectives = await this.prisma.zoneObjective.findMany({
      where: { managerId: profileId },
      orderBy: { startDate: 'desc' },
    });

    // Mettre a jour les realisations dynamiquement pour les objectifs actifs en interrogeant la BD
    const updatedObjectives = [];
    for (const obj of objectives) {
      // Recuperer les pisteurs rattachés a ce CZ
      const profile = await this.prisma.zoneManagerProfile.findUnique({
        where: { id: profileId },
      });
      const subBuyers = await this.prisma.user.findMany({
        where: { managerId: profile.userId },
        select: { id: true },
      });
      const subBuyerIds = subBuyers.map(sb => sb.id);

      // Calcul du volume et de la valeur des achats sur la periode de l'objectif
      const purchasesAgg = await this.prisma.purchase.aggregate({
        where: {
          buyerId: { in: subBuyerIds },
          createdAt: { gte: obj.startDate, lte: obj.endDate },
        },
        _sum: {
          weightNetPaid: true,
          amountGross: true,
        },
      });

      // Calcul des remboursements recus
      const repaymentsAgg = await this.prisma.repayment.aggregate({
        where: {
          credit: {
            subBuyerId: { in: subBuyerIds },
          },
          repaidAt: { gte: obj.startDate, lte: obj.endDate },
        },
        _sum: {
          amount: true,
        },
      });

      // Calcul des planteurs actifs sur la periode
      const activePlantersCount = await this.prisma.purchase.groupBy({
        by: ['planterId'],
        where: {
          buyerId: { in: subBuyerIds },
          createdAt: { gte: obj.startDate, lte: obj.endDate },
          planterId: { not: null },
        },
      });

      // Calcul des nouveaux planteurs crees sur la periode
      const newPlantersCount = await this.prisma.planter.count({
        where: {
          subBuyerId: { in: subBuyerIds },
          createdAt: { gte: obj.startDate, lte: obj.endDate },
        },
      });

      // Mettre a jour l'objet
      const achievedQuantityKg = Number(purchasesAgg._sum.weightNetPaid || 0);
      const achievedValueFCFA = Number(purchasesAgg._sum.amountGross || 0);
      const achievedActivePlanters = activePlantersCount.length;
      const achievedNewPlanters = newPlantersCount;
      const achievedRepaymentFCFA = Number(repaymentsAgg._sum.amount || 0);

      const updatedObj = await this.prisma.zoneObjective.update({
        where: { id: obj.id },
        data: {
          achievedQuantityKg,
          achievedValueFCFA,
          achievedActivePlanters,
          achievedNewPlanters,
          achievedRepaymentFCFA,
        },
      });
      updatedObjectives.push(updatedObj);
    }

    return updatedObjectives;
  }

  // 7. Enregistrer une visite chez un planteur
  async recordVisit(dto: any, auditUserId: string) {
    if (!dto.managerId || !dto.planterId || !dto.purpose || !dto.comments) {
      throw new BadRequestException("Les champs managerId, planterId, purpose, et comments sont requis.");
    }

    // Verifier le chef de zone et le planteur
    const profile = await this.prisma.zoneManagerProfile.findUnique({
      where: { id: dto.managerId },
    });
    if (!profile) {
      throw new NotFoundException("Le profil du chef de zone n'existe pas.");
    }

    const planter = await this.prisma.planter.findUnique({
      where: { id: dto.planterId },
    });
    if (!planter) {
      throw new NotFoundException("Le planteur spécifié n'existe pas.");
    }

    const visit = await this.prisma.planterVisit.create({
      data: {
        managerId: dto.managerId,
        planterId: dto.planterId,
        visitDate: dto.visitDate ? new Date(dto.visitDate) : new Date(),
        purpose: dto.purpose,
        comments: dto.comments,
        latitude: dto.latitude ? parseFloat(dto.latitude) : null,
        longitude: dto.longitude ? parseFloat(dto.longitude) : null,
        photoUrls: dto.photoUrls || [],
        localId: dto.localId || null,
        isSynced: true,
      },
    });

    await this.logAudit(auditUserId, 'RECORD_PLANTER_VISIT', { visitId: visit.id, planterId: dto.planterId });

    return visit;
  }

  // 8. Recupérer les stats consolidées d'un chef de zone
  async getStats(profileId: string) {
    const profile = await this.prisma.zoneManagerProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });
    if (!profile) {
      throw new NotFoundException("Le profil du chef de zone n'existe pas.");
    }

    // Recuperer les pisteurs rattachés a ce CZ
    const subBuyers = await this.prisma.user.findMany({
      where: { managerId: profile.userId },
      select: { id: true },
    });
    const subBuyerIds = subBuyers.map(sb => sb.id);

    // Calcul des statistiques cumulées
    const plantersCount = await this.prisma.planter.count({
      where: {
        OR: [
          { zoneManagerId: profile.userId },
          { subBuyerId: { in: subBuyerIds } },
        ],
      },
    });

    const purchasesAgg = await this.prisma.purchase.aggregate({
      where: { buyerId: { in: subBuyerIds } },
      _sum: {
        weightNetPaid: true,
        amountGross: true,
      },
    });

    const creditsAgg = await this.prisma.credit.aggregate({
      where: {
        subBuyerId: { in: subBuyerIds },
        status: 'ACTIVE',
      },
      _sum: {
        amountGranted: true,
      },
    });

    const repaymentsAgg = await this.prisma.repayment.aggregate({
      where: {
        credit: {
          subBuyerId: { in: subBuyerIds },
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Pertes et qualite moyenne sur les livraisons
    const subBuyerProfiles = await this.prisma.subBuyerProfile.findMany({
      where: {
        user: { managerId: profile.userId },
      },
      select: { id: true },
    });
    const subBuyerProfileIds = subBuyerProfiles.map(s => s.id);

    const deliveriesAgg = await this.prisma.subBuyerDelivery.aggregate({
      where: {
        subBuyerProfileId: { in: subBuyerProfileIds },
        status: { in: ['WEIGHED', 'VALIDATED'] },
      },
      _sum: {
        lossQuantityKg: true,
        declaredQuantityKg: true,
      },
      _avg: {
        moistureContent: true,
        lossPercentage: true,
      },
    });

    const lossRate = deliveriesAgg._avg.lossPercentage || 0;
    const avgMoisture = deliveriesAgg._avg.moistureContent || 7.5;

    // Calcul du score de performance pour la fiche détaillée
    const creditTotal = await this.prisma.credit.aggregate({
      where: { subBuyerId: { in: subBuyerIds } },
      _sum: { amountGranted: true },
    }).then(res => Number(res._sum.amountGranted || 0));

    const repaymentTotal = Number(repaymentsAgg._sum.amount || 0);
    const repaymentRate = creditTotal > 0 ? (repaymentTotal / creditTotal) * 100 : 100;

    const deliveriesCount = await this.prisma.subBuyerDelivery.count({
      where: {
        subBuyerProfileId: { in: subBuyerProfileIds },
        status: { in: ['WEIGHED', 'VALIDATED'] },
      },
    });

    const quantity = Number(purchasesAgg._sum.weightNetPaid || 0);
    const scoreVolume = Math.min((quantity / 50000) * 100, 100);
    const scoreQualite = Math.max(100 - (Math.max(avgMoisture - 7.0, 0) * 50) - (lossRate * 30), 0);
    const scoreRemboursement = repaymentRate;
    const scoreRecrutement = Math.min((plantersCount / 10) * 100, 100);
    const scoreRegularite = Math.min((deliveriesCount / 10) * 100, 100);

    const spg = (scoreVolume * 0.35) + (scoreQualite * 0.20) + (scoreRemboursement * 0.20) + (scoreRecrutement * 0.15) + (scoreRegularite * 0.10);

    return {
      subBuyersCount: subBuyers.length,
      plantersCount,
      totalQuantityKg: quantity,
      totalValueFCFA: Number(purchasesAgg._sum.amountGross || 0),
      activeCreditsValueFCFA: Number(creditsAgg._sum.amountGranted || 0),
      totalRepaymentsValueFCFA: repaymentTotal,
      lossRate,
      avgMoisture,
      deliveriesCount,
      performanceScore: parseFloat(spg.toFixed(2)),
      subScores: {
        volume: parseFloat(scoreVolume.toFixed(2)),
        quality: parseFloat(scoreQualite.toFixed(2)),
        repayment: parseFloat(scoreRemboursement.toFixed(2)),
        recruitment: parseFloat(scoreRecrutement.toFixed(2)),
        regularity: parseFloat(scoreRegularite.toFixed(2)),
      },
    };
  }

  // 9. Calcul du Classement (Leaderboard)
  async getLeaderboard(query: any) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().getFullYear(), 0, 1); // 1er janv par defaut
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const managers = await this.prisma.zoneManagerProfile.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true },
    });

    const leaderboard = [];

    for (const mgr of managers) {
      // Recuperer les pisteurs rattachés a ce CZ
      const subBuyers = await this.prisma.user.findMany({
        where: { managerId: mgr.userId },
        select: { id: true },
      });
      const subBuyerIds = subBuyers.map(sb => sb.id);

      // 1. Volume total acheté
      const purchasesAgg = await this.prisma.purchase.aggregate({
        where: {
          buyerId: { in: subBuyerIds },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          weightNetPaid: true,
          amountGross: true,
        },
      });
      const quantity = Number(purchasesAgg._sum.weightNetPaid || 0);

      // 2. Qualite moyenne (Humidite)
      const subBuyerProfiles = await this.prisma.subBuyerProfile.findMany({
        where: {
          user: { managerId: mgr.userId },
        },
        select: { id: true },
      });
      const subBuyerProfileIds = subBuyerProfiles.map(s => s.id);

      const deliveriesAgg = await this.prisma.subBuyerDelivery.aggregate({
        where: {
          subBuyerProfileId: { in: subBuyerProfileIds },
          status: { in: ['WEIGHED', 'VALIDATED'] },
          deliveryDate: { gte: startDate, lte: endDate },
        },
        _avg: {
          moistureContent: true,
          lossPercentage: true,
        },
      });

      const avgMoisture = deliveriesAgg._avg.moistureContent || 7.5; // valeur standard par defaut
      const lossRate = deliveriesAgg._avg.lossPercentage || 0;

      // 3. Taux de remboursement
      const creditsAgg = await this.prisma.credit.aggregate({
        where: {
          subBuyerId: { in: subBuyerIds },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          amountGranted: true,
        },
      });
      const repaymentsAgg = await this.prisma.repayment.aggregate({
        where: {
          credit: {
            subBuyerId: { in: subBuyerIds },
          },
          repaidAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          amount: true,
        },
      });

      const creditTotal = Number(creditsAgg._sum.amountGranted || 0);
      const repaymentTotal = Number(repaymentsAgg._sum.amount || 0);
      const repaymentRate = creditTotal > 0 ? (repaymentTotal / creditTotal) * 100 : 100;

      // 4. Nombre de nouveaux planteurs recrutés
      const newPlanters = await this.prisma.planter.count({
        where: {
          OR: [
            { zoneManagerId: mgr.userId },
            { subBuyerId: { in: subBuyerIds } },
          ],
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      // 5. Régularité des livraisons (Nombre total de livraisons effectuées)
      const deliveriesCount = await this.prisma.subBuyerDelivery.count({
        where: {
          subBuyerProfileId: { in: subBuyerProfileIds },
          status: { in: ['WEIGHED', 'VALIDATED'] },
          deliveryDate: { gte: startDate, lte: endDate },
        },
      });

      // Calcul des 5 notes intermédiaires sur 100
      const scoreVolume = Math.min((quantity / 50000) * 100, 100);
      const scoreQualite = Math.max(100 - (Math.max(avgMoisture - 7.0, 0) * 50) - (lossRate * 30), 0);
      const scoreRemboursement = repaymentRate;
      const scoreRecrutement = Math.min((newPlanters / 10) * 100, 100);
      const scoreRegularite = Math.min((deliveriesCount / 10) * 100, 100);

      // Score de Performance Globale (SPG) pondéré
      const spg = (scoreVolume * 0.35) + (scoreQualite * 0.20) + (scoreRemboursement * 0.20) + (scoreRecrutement * 0.15) + (scoreRegularite * 0.10);

      leaderboard.push({
        managerId: mgr.id,
        fullName: `${mgr.user.firstName} ${mgr.user.lastName}`,
        performanceScore: parseFloat(spg.toFixed(2)),
        metrics: {
          totalQuantityKg: quantity,
          averageMoisture: parseFloat(avgMoisture.toFixed(2)),
          repaymentRate: parseFloat(repaymentRate.toFixed(2)),
          lossPercentage: parseFloat(lossRate.toFixed(2)),
          newPlantersCount: newPlanters,
          deliveriesCount,
        },
        subScores: {
          volume: parseFloat(scoreVolume.toFixed(2)),
          quality: parseFloat(scoreQualite.toFixed(2)),
          repayment: parseFloat(scoreRemboursement.toFixed(2)),
          recruitment: parseFloat(scoreRecrutement.toFixed(2)),
          regularity: parseFloat(scoreRegularite.toFixed(2)),
        },
      });
    }

    // Trier par score de performance decroissant
    leaderboard.sort((a, b) => b.performanceScore - a.performanceScore);

    // Assigner les rangs
    return leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  }

  // 10. Lister les chefs de zone
  async findAll() {
    return this.prisma.zoneManagerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  // 11. Consulter la fiche detaillee
  async findOne(id: string) {
    const profile = await this.prisma.zoneManagerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            subordinates: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        zones: true,
        assignments: {
          where: { isActive: true },
          include: { zone: true },
        },
        planterVisits: {
          include: { planter: true },
          orderBy: { visitDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Le profil du chef de zone n'existe pas.");
    }

    return profile;
  }
}
