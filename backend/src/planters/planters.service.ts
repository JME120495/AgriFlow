import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class PlantersService {
  constructor(private prisma: PrismaService) {}

  // Log Audit Helper
  private async logAudit(userId: string, action: string, details: any) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        module: 'planters',
        details,
        ipAddress: '127.0.0.1',
        userAgent: 'Internal System',
      },
    });
  }

  // Génération automatique du code planteur : PL-ANNEE-SEQ (ex: PL-2026-0001)
  private async generatePlanterCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `PL-${currentYear}-`;

    const lastPlanter = await this.prisma.planter.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNum = 1;
    if (lastPlanter) {
      const lastNumPart = lastPlanter.code.substring(prefix.length);
      nextNum = parseInt(lastNumPart, 10) + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  // 1. Créer un planteur
  async create(dto: any, userId: string) {
    const code = await this.generatePlanterCode();

    const planter = await this.prisma.$transaction(async (tx) => {
      // Création du planteur
      const p = await tx.planter.create({
        data: {
          code,
          firstName: dto.first_name,
          lastName: dto.last_name,
          gender: dto.gender || 'M',
          birthDate: dto.birth_date ? new Date(dto.birth_date) : null,
          avatarUrl: dto.avatar_url || null,
          phone: dto.phone || null,
          phoneSecondary: dto.phone_secondary || null,
          address: dto.address || null,
          idType: dto.id_type || null,
          idNumber: dto.id_number || null,
          idExpiry: dto.id_expiry ? new Date(dto.id_expiry) : null,
          idFrontUrl: dto.id_front_url || null,
          idBackUrl: dto.id_back_url || null,
          storeId: dto.store_id || null,
          zoneManagerId: dto.zone_manager_id || null,
          subBuyerId: dto.sub_buyer_id || null,
          status: dto.status || 'ACTIVE',
        },
      });

      // Création de la plantation liée
      if (dto.plantation) {
        await tx.plantation.create({
          data: {
            planterId: p.id,
            name: dto.plantation.name,
            location: dto.plantation.location || null,
            areaHectares: parseFloat(dto.plantation.area_hectares) || 0.0,
            parcelsCount: parseInt(dto.plantation.parcels_count, 10) || 1,
            treesCount: dto.plantation.trees_count ? parseInt(dto.plantation.trees_count, 10) : null,
            creationYear: dto.plantation.creation_year ? parseInt(dto.plantation.creation_year, 10) : null,
            variety: dto.plantation.variety || null,
            latitude: dto.plantation.latitude ? parseFloat(dto.plantation.latitude) : null,
            longitude: dto.plantation.longitude ? parseFloat(dto.plantation.longitude) : null,
          },
        });
      }

      return p;
    });

    await this.logAudit(userId, 'PLANTER_CREATE', { planterId: planter.id, code });
    return planter;
  }

  // 2. Recherche et Liste avec filtres et pagination
  async findAll(query: any) {
    const { search, storeId, zoneManagerId, status, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
        { plantation: { location: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (storeId) where.storeId = storeId;
    if (zoneManagerId) where.zoneManagerId = zoneManagerId;
    if (status) where.status = status as UserStatus;

    const [planters, total] = await Promise.all([
      this.prisma.planter.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          store: { select: { name: true } },
          zoneManager: { select: { firstName: true, lastName: true } },
          subBuyer: { select: { firstName: true, lastName: true } },
          plantation: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.planter.count({ where }),
    ]);

    return {
      planters,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  // 3. Récupérer un planteur avec ses KPIs cumulés
  async findOne(id: string) {
    const planter = await this.prisma.planter.findUnique({
      where: { id },
      include: {
        store: true,
        zoneManager: { select: { id: true, firstName: true, lastName: true } },
        subBuyer: { select: { id: true, firstName: true, lastName: true } },
        plantation: true,
        documents: true,
      },
    });

    if (!planter) throw new NotFoundException('Planteur non trouvé');

    // Calcul des KPIs cumulés
    const purchases = await this.prisma.purchase.findMany({
      where: { planterId: id },
      select: { weightNetPaid: true, amountGross: true, createdAt: true },
    });

    const credits = await this.prisma.credit.findMany({
      where: { planterId: id },
      include: { repayments: true },
    });

    const payments = await this.prisma.payment.findMany({
      where: { planterId: id },
      select: { amount: true, date: true },
    });

    const totalSoldKg = purchases.reduce((acc, p) => acc + p.weightNetPaid, 0);
    const totalPurchasesAmount = purchases.reduce((acc, p) => acc + p.amountGross, 0);
    const totalPaymentsAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalCreditsGranted = credits.reduce((acc, c) => acc + Number(c.amountGranted), 0);

    let totalCreditsEnCours = 0;
    credits.forEach(c => {
      const repaid = c.repayments.reduce((acc, r) => acc + Number(r.amount), 0);
      if (c.status !== 'REPAID') {
        totalCreditsEnCours += (Number(c.amountGranted) - repaid);
      }
    });

    const lastDelivery = purchases.length > 0
      ? purchases.reduce((max, p) => p.createdAt > max.createdAt ? p : max, purchases[0])
      : null;

    const lastPayment = payments.length > 0
      ? payments.reduce((max, p) => p.date > max.date ? p : max, payments[0])
      : null;

    return {
      ...planter,
      kpis: {
        totalSoldKg,
        totalPurchasesAmount,
        totalPaymentsAmount,
        totalCreditsGranted,
        creditsRemaining: totalCreditsEnCours,
        deliveriesCount: purchases.length,
        lastDeliveryDate: lastDelivery ? lastDelivery.createdAt : null,
        lastPaymentDate: lastPayment ? lastPayment.date : null,
      },
    };
  }

  // 4. Modifier un planteur
  async update(id: string, dto: any, userId: string) {
    const planter = await this.prisma.planter.findUnique({ where: { id } });
    if (!planter) throw new NotFoundException('Planteur non trouvé');

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.planter.update({
        where: { id },
        data: {
          firstName: dto.first_name,
          lastName: dto.last_name,
          gender: dto.gender,
          birthDate: dto.birth_date ? new Date(dto.birth_date) : undefined,
          avatarUrl: dto.avatar_url,
          phone: dto.phone,
          phoneSecondary: dto.phone_secondary,
          address: dto.address,
          idType: dto.id_type,
          idNumber: dto.id_number,
          idExpiry: dto.id_expiry ? new Date(dto.id_expiry) : undefined,
          idFrontUrl: dto.id_front_url,
          idBackUrl: dto.id_back_url,
          storeId: dto.store_id,
          zoneManagerId: dto.zone_manager_id,
          subBuyerId: dto.sub_buyer_id,
          status: dto.status,
        },
      });

      if (dto.plantation) {
        await tx.plantation.upsert({
          where: { planterId: id },
          update: {
            name: dto.plantation.name,
            location: dto.plantation.location,
            areaHectares: parseFloat(dto.plantation.area_hectares),
            parcelsCount: parseInt(dto.plantation.parcels_count, 10),
            treesCount: dto.plantation.trees_count ? parseInt(dto.plantation.trees_count, 10) : undefined,
            creationYear: dto.plantation.creation_year ? parseInt(dto.plantation.creation_year, 10) : undefined,
            variety: dto.plantation.variety,
            latitude: dto.plantation.latitude ? parseFloat(dto.plantation.latitude) : undefined,
            longitude: dto.plantation.longitude ? parseFloat(dto.plantation.longitude) : undefined,
          },
          create: {
            planterId: id,
            name: dto.plantation.name,
            location: dto.plantation.location,
            areaHectares: parseFloat(dto.plantation.area_hectares) || 0.0,
            parcelsCount: parseInt(dto.plantation.parcels_count, 10) || 1,
            treesCount: dto.plantation.trees_count ? parseInt(dto.plantation.trees_count, 10) : null,
            creationYear: dto.plantation.creation_year ? parseInt(dto.plantation.creation_year, 10) : null,
            variety: dto.plantation.variety || null,
            latitude: dto.plantation.latitude ? parseFloat(dto.plantation.latitude) : null,
            longitude: dto.plantation.longitude ? parseFloat(dto.plantation.longitude) : null,
          },
        });
      }

      return p;
    });

    await this.logAudit(userId, 'PLANTER_UPDATE', { planterId: id });
    return updated;
  }

  // 5. Suppression logique (Désactivation)
  async remove(id: string, userId: string) {
    const planter = await this.prisma.planter.findUnique({ where: { id } });
    if (!planter) throw new NotFoundException('Planteur non trouvé');

    await this.prisma.planter.update({
      where: { id },
      data: { status: 'DEACTIVATED' },
    });

    await this.logAudit(userId, 'PLANTER_DEACTIVATE', { planterId: id });
    return { success: true };
  }

  // 6. Historique détaillé (Achats, Crédits, Paiements)
  async getHistory(id: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: { planterId: id },
      orderBy: { createdAt: 'desc' },
      include: { store: { select: { name: true } } },
    });

    const credits = await this.prisma.credit.findMany({
      where: { planterId: id },
      orderBy: { createdAt: 'desc' },
      include: { repayments: true },
    });

    const payments = await this.prisma.payment.findMany({
      where: { planterId: id },
      orderBy: { date: 'desc' },
    });

    return { purchases, credits, payments };
  }

  // 7. Accorder un crédit
  async grantCredit(id: string, dto: any, userId: string) {
    const planter = await this.prisma.planter.findUnique({ where: { id } });
    if (!planter) throw new NotFoundException('Planteur non trouvé');

    const category = await this.prisma.creditCategory.findFirst({
      where: { code: 'AVANCE_CAMPAGNE' },
    }) || await this.prisma.creditCategory.findFirst();

    if (!category) throw new BadRequestException('Aucune catégorie de crédit disponible.');

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').substring(0, 6); // YYYYMM
    const count = await this.prisma.credit.count({
      where: { creditNumber: { startsWith: `CRE-${dateStr}` } },
    });
    const seq = (count + 1).toString().padStart(4, '0');
    const creditNumber = `CRE-${dateStr}-${seq}`;

    const credit = await this.prisma.credit.create({
      data: {
        creditNumber,
        beneficiaryType: 'PLANTER',
        beneficiaryId: id,
        categoryId: category.id,
        amountGranted: parseFloat(dto.amount),
        balance: parseFloat(dto.amount),
        grantedAt: new Date(),
        dueDate: new Date(dto.due_date),
        paymentMethod: 'CASH',
        sourceAccount: 'CAISSE_CENTRALE',
        status: 'ACTIVE',
        createdById: userId,
        planterId: id,
      },
    });

    await this.logAudit(userId, 'CREDIT_GRANT', { planterId: id, creditId: credit.id, amount: dto.amount });
    return credit;
  }

  // 8. Enregistrer un remboursement de crédit (manuel)
  async recordRepayment(id: string, dto: any, userId: string) {
    const credit = await this.prisma.credit.findUnique({
      where: { id: dto.credit_id },
      include: { repayments: true },
    });

    if (!credit) throw new NotFoundException('Crédit non trouvé');
    if (credit.status === 'REPAID') throw new BadRequestException('Ce crédit est déjà entièrement remboursé');

    const alreadyRepaid = Number(credit.amountRepaid);
    const remaining = Number(credit.balance);
    const repaymentAmount = Math.min(parseFloat(dto.amount), remaining);

    const repayment = await this.prisma.$transaction(async (tx) => {
      const rep = await tx.repayment.create({
        data: {
          creditId: dto.credit_id,
          amount: repaymentAmount,
          repaidAt: new Date(),
          paymentMethod: 'CASH',
          userId,
        },
      });

      const newAmountRepaid = alreadyRepaid + repaymentAmount;
      const newBalance = remaining - repaymentAmount;
      const newStatus = newBalance <= 0 ? 'REPAID' : credit.status;

      await tx.credit.update({
        where: { id: dto.credit_id },
        data: { 
          amountRepaid: newAmountRepaid,
          balance: newBalance,
          status: newStatus 
        },
      });

      return rep;
    });

    await this.logAudit(userId, 'CREDIT_REPAYMENT_MANUAL', { creditId: dto.credit_id, amount: repaymentAmount });
    return repayment;
  }

  // 9. Télécharger un document GED
  async uploadDocument(id: string, dto: any) {
    return this.prisma.planterDocument.create({
      data: {
        planterId: id,
        name: dto.name,
        type: dto.type,
        fileUrl: dto.file_url,
        expiryDate: dto.expiry_date ? new Date(dto.expiry_date) : null,
      },
    });
  }

  // 10. Statistiques mensuelles pour graphiques de performance
  async getStats(id: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: { planterId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Agrégation par mois
    const monthlyMap = new Map<string, { month: string; quantity: number; amount: number }>();
    purchases.forEach(p => {
      const month = p.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const existing = monthlyMap.get(month) || { month, quantity: 0, amount: 0 };
      existing.quantity += p.weightNetPaid;
      existing.amount += p.amountGross;
      monthlyMap.set(month, existing);
    });

    return Array.from(monthlyMap.values());
  }
}
