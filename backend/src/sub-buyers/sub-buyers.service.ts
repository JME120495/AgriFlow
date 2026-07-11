import { Injectable, BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class SubBuyersService {
  constructor(private prisma: PrismaService) {}

  // Helper to generate codes: SA-YYYY-MM-XXXX, AV-YYYY-MM-XXXX, LIV-YYYY-MM-XXXX
  private async generateCode(prefix: 'SA' | 'AV' | 'LIV'): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const datePrefix = `${prefix}-${year}-${month}-`;

    let count = 0;
    if (prefix === 'SA') {
      count = await this.prisma.user.count({
        where: {
          jobTitle: 'Sous-Acheteur',
          createdAt: {
            gte: new Date(year, now.getMonth(), 1),
            lt: new Date(year, now.getMonth() + 1, 1),
          },
        },
      });
    } else if (prefix === 'AV') {
      count = await this.prisma.subBuyerAdvance.count({
        where: {
          code: { startsWith: datePrefix },
        },
      });
    } else if (prefix === 'LIV') {
      count = await this.prisma.subBuyerDelivery.count({
        where: {
          code: { startsWith: datePrefix },
        },
      });
    }

    const sequence = String(count + 1).padStart(4, '0');
    return `${datePrefix}${sequence}`;
  }

  // Create Sub-buyer User & Profile
  async create(data: any, creatorId: string) {
    // 1. Verify phone and email uniqueness
    if (data.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existingEmail) throw new BadRequestException('Cet email est déjà utilisé.');
    }
    if (data.phone) {
      const existingPhone = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingPhone) throw new BadRequestException('Ce numéro de téléphone est déjà utilisé.');
    }

    // 2. Fetch role for SOUS_ACHETEUR
    const role = await this.prisma.role.findFirst({ where: { name: 'SOUS_ACHETEUR' } });
    if (!role) throw new NotFoundException('Rôle SOUS_ACHETEUR non trouvé en base.');

    // 3. Hash password
    const passwordHash = await argon2.hash(data.password || 'Password123!');

    // 4. Create User & Profile in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email || null,
          phone: data.phone || null,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          avatarUrl: data.photoUrl || null,
          address: data.address || null,
          jobTitle: 'Sous-Acheteur',
          roleId: role.id,
          storeId: data.storeId || null,
          managerId: data.managerId || null, // Chef de zone
          hireDate: new Date(),
          status: UserStatus.ACTIVE,
        },
      });

      const profileCode = await this.generateCode('SA');

      const profile = await tx.subBuyerProfile.create({
        data: {
          userId: user.id,
          gender: data.gender || 'M',
          birthDate: new Date(data.birthDate),
          photoUrl: data.photoUrl || null,
          phoneSecondary: data.phoneSecondary || null,
          idType: data.idType,
          idNumber: data.idNumber,
          idExpiryDate: new Date(data.idExpiryDate),
          idFrontUrl: data.idFrontUrl || '',
          idBackUrl: data.idBackUrl || '',
          purchaseZone: data.purchaseZone,
          region: data.region,
          department: data.department,
          district: data.arrondissement || data.district,
          mainVillage: data.mainVillage,
          creditLimit: data.creditLimit || 5000000.0,
        },
      });

      return {
        id: user.id,
        code: profileCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        profileId: profile.id,
      };
    });
  }

  // Find all sub-buyers with filters
  async findAll(query: any) {
    const where: any = {
      role: { name: 'SOUS_ACHETEUR' },
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.storeId) {
      where.storeId = query.storeId;
    }
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        subBuyerProfile: true,
        store: true,
        manager: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      status: u.status,
      store: u.store?.name || null,
      manager: u.manager ? `${u.manager.firstName} ${u.manager.lastName}` : null,
      profile: u.subBuyerProfile,
    }));
  }

  // Find detailed sub-buyer profile
  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subBuyerProfile: {
          include: {
            advances: { orderBy: { date: 'desc' } },
            deliveries: { include: { store: true }, orderBy: { deliveryDate: 'desc' } },
            ledgerEntries: { orderBy: { date: 'desc' }, take: 20 },
            expenses: { orderBy: { date: 'desc' } },
          },
        },
        store: true,
        manager: true,
      },
    });

    if (!user || user.jobTitle !== 'Sous-Acheteur') {
      throw new NotFoundException('Sous-acheteur non trouvé.');
    }

    return user;
  }

  // Update profile
  async update(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { subBuyerProfile: true } });
    if (!user || !user.subBuyerProfile) throw new NotFoundException('Sous-acheteur non trouvé.');

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName ?? user.firstName,
          lastName: data.lastName ?? user.lastName,
          email: data.email ?? user.email,
          phone: data.phone ?? user.phone,
          storeId: data.storeId ?? user.storeId,
          managerId: data.managerId ?? user.managerId,
        },
      });

      const profile = await tx.subBuyerProfile.update({
        where: { userId },
        data: {
          phoneSecondary: data.phoneSecondary ?? user.subBuyerProfile.phoneSecondary,
          purchaseZone: data.purchaseZone ?? user.subBuyerProfile.purchaseZone,
          region: data.region ?? user.subBuyerProfile.region,
          department: data.department ?? user.subBuyerProfile.department,
          district: data.arrondissement ?? data.district ?? user.subBuyerProfile.district,
          mainVillage: data.mainVillage ?? user.subBuyerProfile.mainVillage,
          creditLimit: data.creditLimit ?? user.subBuyerProfile.creditLimit,
        },
      });

      return profile;
    });
  }

  // Suspend Sub-buyer
  async suspend(userId: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Sous-acheteur non trouvé.');

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });
  }

  // Grant Finance Advance
  async grantAdvance(userId: string, data: any, validatorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subBuyerProfile: true },
    });
    if (!user || !user.subBuyerProfile) throw new NotFoundException('Sous-acheteur ou profil non trouvé.');
    if (user.status !== UserStatus.ACTIVE) throw new BadRequestException('Le compte de ce sous-acheteur est suspendu ou inactif.');

    const amount = Number(data.amount);
    if (amount <= 0) throw new BadRequestException("Le montant de l'avance doit être supérieur à 0.");

    // Calculate currently unjustified advances
    const activeAdvances = await this.prisma.subBuyerAdvance.findMany({
      where: {
        subBuyerProfileId: user.subBuyerProfile.id,
        status: { in: ['DISBURSED', 'PARTIALLY_JUSTIFIED'] },
      },
    });
    const currentUnjustified = activeAdvances.reduce((sum, adv) => sum + adv.remainingAmount, 0);

    // Verify limit constraint
    if (currentUnjustified + amount > user.subBuyerProfile.creditLimit) {
      throw new UnprocessableEntityException(
        `Dépassement du plafond de crédit autorisé. Plafond : ${user.subBuyerProfile.creditLimit} FCFA. Encours actuel : ${currentUnjustified} FCFA. Demande : ${amount} FCFA.`
      );
    }

    const code = await this.generateCode('AV');

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Advance
      const advance = await tx.subBuyerAdvance.create({
        data: {
          code,
          subBuyerProfileId: user.subBuyerProfile.id,
          amount,
          remainingAmount: amount,
          reason: data.reason || 'ACHAT_CACAO',
          paymentMethod: data.paymentMethod || 'CASH',
          validatedById: validatorId,
          observations: data.observations || '',
        },
      });

      // 2. Fetch last ledger balance to calculate progress balance
      const lastLedger = await tx.subBuyerLedger.findFirst({
        where: { subBuyerProfileId: user.subBuyerProfile.id },
        orderBy: { createdAt: 'desc' },
      });
      const previousBalance = lastLedger ? lastLedger.balance : 0;
      const newBalance = previousBalance + amount;

      // 3. Create Ledger Entry
      await tx.subBuyerLedger.create({
        data: {
          subBuyerProfileId: user.subBuyerProfile.id,
          type: 'CREDIT',
          amount,
          balance: newBalance,
          advanceId: advance.id,
          description: `Octroi d'avance financière Réf: ${code} - Motif: ${advance.reason}`,
        },
      });

      return advance;
    });
  }

  // Register operational expense in brousse
  async createExpense(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subBuyerProfile: true },
    });
    if (!user || !user.subBuyerProfile) throw new NotFoundException('Sous-acheteur non trouvé.');

    return this.prisma.subBuyerExpense.create({
      data: {
        subBuyerProfileId: user.subBuyerProfile.id,
        amount: Number(data.amount),
        category: data.category || 'TRANSPORT',
        description: data.description || '',
        receiptUrl: data.receiptUrl || null,
        status: 'PENDING',
      },
    });
  }

  // Validate operational expense (accounting)
  async validateExpense(expenseId: string, status: 'APPROVED' | 'REJECTED', validatorId: string) {
    const expense = await this.prisma.subBuyerExpense.findUnique({
      where: { id: expenseId },
      include: { subBuyerProfile: true },
    });
    if (!expense) throw new NotFoundException('Dépense non trouvée.');
    if (expense.status !== 'PENDING') throw new BadRequestException('Cette dépense a déjà été traitée.');

    if (status === 'REJECTED') {
      return this.prisma.subBuyerExpense.update({
        where: { id: expenseId },
        data: { status: 'REJECTED', validatedById: validatorId },
      });
    }

    // Process approval with advance justification deduction
    return this.prisma.$transaction(async (tx) => {
      // 1. Approve expense
      const approvedExpense = await tx.subBuyerExpense.update({
        where: { id: expenseId },
        data: { status: 'APPROVED', validatedById: validatorId },
      });

      // 2. Perform financial justification allocation
      let amountToAllocate = approvedExpense.amount;
      const advances = await tx.subBuyerAdvance.findMany({
        where: {
          subBuyerProfileId: approvedExpense.subBuyerProfileId,
          status: { in: ['DISBURSED', 'PARTIALLY_JUSTIFIED'] },
        },
        orderBy: { date: 'asc' }, // FIFO justification
      });

      for (const adv of advances) {
        if (amountToAllocate <= 0) break;

        const allocated = Math.min(amountToAllocate, adv.remainingAmount);
        const newRemaining = adv.remainingAmount - allocated;

        await tx.subBuyerAdvance.update({
          where: { id: adv.id },
          data: {
            remainingAmount: newRemaining,
            status: newRemaining === 0 ? 'FULLY_JUSTIFIED' : 'PARTIALLY_JUSTIFIED',
          },
        });

        await tx.subBuyerAdvanceJustification.create({
          data: {
            advanceId: adv.id,
            type: 'EXPENSE',
            amount: allocated,
            expenseId: approvedExpense.id,
          },
        });

        amountToAllocate -= allocated;
      }

      // 3. Update Ledger
      const lastLedger = await tx.subBuyerLedger.findFirst({
        where: { subBuyerProfileId: approvedExpense.subBuyerProfileId },
        orderBy: { createdAt: 'desc' },
      });
      const previousBalance = lastLedger ? lastLedger.balance : 0;
      const newBalance = previousBalance - approvedExpense.amount;

      await tx.subBuyerLedger.create({
        data: {
          subBuyerProfileId: approvedExpense.subBuyerProfileId,
          type: 'DEBIT',
          amount: approvedExpense.amount,
          balance: newBalance,
          expenseId: approvedExpense.id,
          description: `Justification de dépense validée (${approvedExpense.category}) : ${approvedExpense.description}`,
        },
      });

      return approvedExpense;
    });
  }

  // Record Cash Repayment (accountant)
  async recordCashRepayment(userId: string, data: any, validatorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subBuyerProfile: true },
    });
    if (!user || !user.subBuyerProfile) throw new NotFoundException('Sous-acheteur non trouvé.');

    const amount = Number(data.amount);
    if (amount <= 0) throw new BadRequestException('Le montant doit être supérieur à 0.');

    return this.prisma.$transaction(async (tx) => {
      let amountToAllocate = amount;
      const advances = await tx.subBuyerAdvance.findMany({
        where: {
          subBuyerProfileId: user.subBuyerProfile.id,
          status: { in: ['DISBURSED', 'PARTIALLY_JUSTIFIED'] },
        },
        orderBy: { date: 'asc' },
      });

      for (const adv of advances) {
        if (amountToAllocate <= 0) break;

        const allocated = Math.min(amountToAllocate, adv.remainingAmount);
        const newRemaining = adv.remainingAmount - allocated;

        await tx.subBuyerAdvance.update({
          where: { id: adv.id },
          data: {
            remainingAmount: newRemaining,
            status: newRemaining === 0 ? 'FULLY_JUSTIFIED' : 'PARTIALLY_JUSTIFIED',
          },
        });

        await tx.subBuyerAdvanceJustification.create({
          data: {
            advanceId: adv.id,
            type: 'CASH_REPAYMENT',
            amount: allocated,
            date: new Date(),
          },
        });

        amountToAllocate -= allocated;
      }

      // Record Ledger
      const lastLedger = await tx.subBuyerLedger.findFirst({
        where: { subBuyerProfileId: user.subBuyerProfile.id },
        orderBy: { createdAt: 'desc' },
      });
      const previousBalance = lastLedger ? lastLedger.balance : 0;
      const newBalance = previousBalance - amount;

      const ledgerEntry = await tx.subBuyerLedger.create({
        data: {
          subBuyerProfileId: user.subBuyerProfile.id,
          type: 'DEBIT',
          amount,
          balance: newBalance,
          description: `Remboursement direct en espèces. Observations : ${data.observations || ''}`,
        },
      });

      return ledgerEntry;
    });
  }

  // Sub-buyer declares delivery departure from field
  async declareDelivery(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subBuyerProfile: true },
    });
    if (!user || !user.subBuyerProfile) throw new NotFoundException('Sous-acheteur non trouvé.');

    const code = await this.generateCode('LIV');

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Delivery
      const delivery = await tx.subBuyerDelivery.create({
        data: {
          code,
          subBuyerProfileId: user.subBuyerProfile.id,
          storeId: data.storeId,
          deliveryDate: new Date(),
          declaredQuantityKg: Number(data.declaredQuantityKg),
          declaredBagCount: Number(data.declaredBagCount),
          status: 'SUBMITTED',
          notes: data.notes || '',
        },
      });

      // 2. Link purchases if provided
      if (data.purchaseIds && Array.isArray(data.purchaseIds)) {
        await tx.purchase.updateMany({
          where: { id: { in: data.purchaseIds }, buyerId: userId },
          data: { deliveryId: delivery.id },
        });
      }

      return delivery;
    });
  }

  // Magasinier weighs and validates delivery (Reconciliation)
  async weighDelivery(deliveryId: string, data: any, magasinierId: string) {
    const delivery = await this.prisma.subBuyerDelivery.findUnique({
      where: { id: deliveryId },
      include: { subBuyerProfile: { include: { user: true } }, purchases: true },
    });
    if (!delivery) throw new NotFoundException('Livraison non trouvée.');
    if (delivery.status !== 'SUBMITTED') throw new BadRequestException('Cette livraison a déjà été traitée.');

    const receivedQuantityKg = Number(data.receivedQuantityKg);
    const receivedBagCount = Number(data.receivedBagCount);
    const moistureContent = Number(data.moistureContent);
    const subgradePercentage = Number(data.subgradePercentage || 0.0);

    const lossQuantityKg = delivery.declaredQuantityKg - receivedQuantityKg;
    const lossPercentage = (lossQuantityKg / delivery.declaredQuantityKg) * 100;

    // Check discrepancy threshold (1.5% tolerance)
    const toleranceThreshold = 1.5;
    const alertTriggered = lossPercentage > toleranceThreshold;
    const status = alertTriggered ? 'LITIGATION' : 'VALIDATED';

    return this.prisma.$transaction(async (tx) => {
      // 1. Update delivery with weigh scales
      const updatedDelivery = await tx.subBuyerDelivery.update({
        where: { id: deliveryId },
        data: {
          receivedQuantityKg,
          receivedBagCount,
          lossQuantityKg,
          lossPercentage,
          moistureContent,
          subgradePercentage,
          status,
          magasinierId,
          alertTriggered,
          notes: data.notes || delivery.notes,
        },
      });

      // 2. Increment store stocks if validated or litigated (we hold the cacao in warehouse either way)
      await tx.stockMovement.create({
        data: {
          storeId: delivery.storeId,
          quantityKg: receivedQuantityKg,
          bagCount: receivedBagCount,
          type: 'TRANSFER_IN',
          referenceId: delivery.id,
          createdById: magasinierId,
        },
      });

      // 3. Trigger system alert if discrepancy is abnormal
      if (alertTriggered) {
        await tx.systemAlert.create({
          data: {
            type: 'SUSPICIOUS_TRANSACTION',
            severity: 'CRITICAL',
            message: `Écart important de pesée sur livraison Réf: ${delivery.code} du sous-acheteur ${delivery.subBuyerProfile.user.firstName} ${delivery.subBuyerProfile.user.lastName}. Perte : ${lossQuantityKg.toFixed(1)} Kg (${lossPercentage.toFixed(2)}%). Seuil : ${toleranceThreshold}%.`,
            storeId: delivery.storeId,
            userId: delivery.subBuyerProfile.userId,
          },
        });
      }

      // 4. Financial justification of advances if validated
      if (status === 'VALIDATED') {
        // Transfer price: we multiply received quantity by the cooperative purchase price
        // Assuming default standard coop purchase price of 1,800 FCFA/Kg
        const standardPricePerKg = 1800.0;
        const totalValue = receivedQuantityKg * standardPricePerKg;

        let amountToAllocate = totalValue;
        const advances = await tx.subBuyerAdvance.findMany({
          where: {
            subBuyerProfileId: delivery.subBuyerProfileId,
            status: { in: ['DISBURSED', 'PARTIALLY_JUSTIFIED'] },
          },
          orderBy: { date: 'asc' },
        });

        for (const adv of advances) {
          if (amountToAllocate <= 0) break;

          const allocated = Math.min(amountToAllocate, adv.remainingAmount);
          const newRemaining = adv.remainingAmount - allocated;

          await tx.subBuyerAdvance.update({
            where: { id: adv.id },
            data: {
              remainingAmount: newRemaining,
              status: newRemaining === 0 ? 'FULLY_JUSTIFIED' : 'PARTIALLY_JUSTIFIED',
            },
          });

          await tx.subBuyerAdvanceJustification.create({
            data: {
              advanceId: adv.id,
              type: 'PURCHASE',
              amount: allocated,
              date: new Date(),
            },
          });

          amountToAllocate -= allocated;
        }

        // Write Ledger Entry
        const lastLedger = await tx.subBuyerLedger.findFirst({
          where: { subBuyerProfileId: delivery.subBuyerProfileId },
          orderBy: { createdAt: 'desc' },
        });
        const previousBalance = lastLedger ? lastLedger.balance : 0;
        const newBalance = previousBalance - totalValue;

        await tx.subBuyerLedger.create({
          data: {
            subBuyerProfileId: delivery.subBuyerProfileId,
            type: 'DEBIT',
            amount: totalValue,
            balance: newBalance,
            deliveryId: delivery.id,
            description: `Livraison de cacao enregistrée Réf: ${delivery.code} (${receivedQuantityKg} Kg)`,
          },
        });
      }

      return updatedDelivery;
    });
  }

  // Get Wallet & Ledger Entries
  async getLedger(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subBuyerProfile: true },
    });
    if (!user || !user.subBuyerProfile) throw new NotFoundException('Sous-acheteur non trouvé.');

    const entries = await this.prisma.subBuyerLedger.findMany({
      where: { subBuyerProfileId: user.subBuyerProfile.id },
      include: {
        advance: true,
        delivery: true,
        expense: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const lastLedger = entries[0];
    const currentBalance = lastLedger ? lastLedger.balance : 0;

    return {
      currentBalance,
      history: entries,
    };
  }

  // Attached Planters list
  async getAttachedPlanters(userId: string) {
    return this.prisma.planter.findMany({
      where: { subBuyerId: userId },
      include: {
        plantation: true,
        purchases: {
          where: { buyerId: userId },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Get Dashboard Consolidate Stats
  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subBuyerProfile: true },
    });
    if (!user || !user.subBuyerProfile) throw new NotFoundException('Sous-acheteur non trouvé.');

    const profileId = user.subBuyerProfile.id;

    // 1. Finances
    const lastLedger = await this.prisma.subBuyerLedger.findFirst({
      where: { subBuyerProfileId: profileId },
      orderBy: { createdAt: 'desc' },
    });
    const currentBalance = lastLedger ? lastLedger.balance : 0.0;

    const allAdvances = await this.prisma.subBuyerAdvance.findMany({
      where: { subBuyerProfileId: profileId, status: { not: 'PENDING' } },
    });
    const totalAdvances = allAdvances.reduce((sum, a) => sum + a.amount, 0);
    const totalUnjustified = allAdvances.reduce((sum, a) => sum + a.remainingAmount, 0);

    // 2. Cocoa Purchases Volumes
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const purchases = await this.prisma.purchase.findMany({
      where: { buyerId: userId },
    });

    const purchasedToday = purchases
      .filter((p) => p.createdAt >= startOfToday)
      .reduce((sum, p) => sum + p.weightNetPaid, 0);

    const purchasedMonth = purchases
      .filter((p) => p.createdAt >= startOfMonth)
      .reduce((sum, p) => sum + p.weightNetPaid, 0);

    const purchasedYear = purchases
      .filter((p) => p.createdAt >= startOfYear)
      .reduce((sum, p) => sum + p.weightNetPaid, 0);

    // 3. Counters
    const activePlantersCount = await this.prisma.planter.count({
      where: {
        subBuyerId: userId,
        purchases: {
          some: {
            buyerId: userId,
            createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, // active last 30 days
          },
        },
      },
    });

    const deliveriesCount = await this.prisma.subBuyerDelivery.count({
      where: { subBuyerProfileId: profileId },
    });

    // 4. Averages
    const totalPurchasedKg = purchases.reduce((sum, p) => sum + p.weightNetPaid, 0);
    const totalPurchasedAmount = purchases.reduce((sum, p) => sum + p.amountGross, 0);
    const avgPurchasePrice = totalPurchasedKg > 0 ? totalPurchasedAmount / totalPurchasedKg : 0.0;

    // Average cost per Kg: (Total purchases amount + validated expenses) / total delivered Kg
    const approvedExpenses = await this.prisma.subBuyerExpense.findMany({
      where: { subBuyerProfileId: profileId, status: 'APPROVED' },
    });
    const totalExpensesAmount = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

    const validatedDeliveries = await this.prisma.subBuyerDelivery.findMany({
      where: { subBuyerProfileId: profileId, status: 'VALIDATED' },
    });
    const totalDeliveredKg = validatedDeliveries.reduce((sum, d) => sum + (d.receivedQuantityKg || 0), 0);

    const avgCostPerKg = totalDeliveredKg > 0 ? (totalPurchasedAmount + totalExpensesAmount) / totalDeliveredKg : 0.0;

    // 5. Global Performance score
    const creditRatio = totalAdvances > 0 ? currentBalance / totalAdvances : 0;
    const limitRisk = creditRatio > 0.8 ? 0 : 100 - (creditRatio * 100); // Score Respect Plafond (sur 100)

    const totalWeighedDeliveries = await this.prisma.subBuyerDelivery.findMany({
      where: { subBuyerProfileId: profileId, status: { in: ['VALIDATED', 'LITIGATION'] } },
    });
    const totalLossKg = totalWeighedDeliveries.reduce((sum, d) => sum + (d.lossQuantityKg || 0), 0);
    const totalDeclaredKg = totalWeighedDeliveries.reduce((sum, d) => sum + d.declaredQuantityKg, 0);
    const avgLossRate = totalDeclaredKg > 0 ? (totalLossKg / totalDeclaredKg) * 100 : 0;
    const lossScore = Math.max(0, 100 - (avgLossRate * 30)); // Score Taux de Perte (sur 100)

    // Volume vs Objectif (Objectif mensuel de 10 tonnes par défaut si non défini)
    const monthlyObjectiveKg = 10000;
    const volumeScore = Math.min((purchasedMonth / monthlyObjectiveKg) * 100, 100);

    // Nouvelle pondération: Respect Plafond (30%), Taux de Perte (40%), Volume (30%)
    const performanceScore = Math.round((limitRisk * 0.3) + (lossScore * 0.4) + (volumeScore * 0.3));

    return {
      currentBalance,
      totalAdvances,
      totalUnjustified,
      purchasedToday,
      purchasedMonth,
      purchasedYear,
      activePlantersCount,
      deliveriesCount,
      avgPurchasePrice,
      avgCostPerKg,
      performanceScore,
    };
  }
}
