import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // Applique les restrictions de sécurité basées sur le rôle de l'utilisateur
  private async getSecurityFilters(user: any) {
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!userWithRole) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }

    const roleName = userWithRole.role.name.toUpperCase();
    const filters: any = {
      role: roleName,
      storeId: null,
      userId: null,
      allowedStoreIds: [],
      allowedUserIds: [],
    };

    if (roleName === 'DIRECTEUR' || roleName === 'COMPTABLE' || roleName === 'ADMIN') {
      // Accès global
      return filters;
    } else if (roleName === 'MAGASINIER') {
      // Uniquement son magasin
      if (!userWithRole.storeId) {
        throw new ForbiddenException("Le magasinier n'est affecté à aucun magasin");
      }
      filters.storeId = userWithRole.storeId;
      filters.allowedStoreIds = [userWithRole.storeId];
      return filters;
    } else if (roleName === 'SOUS_ACHETEUR') {
      // Uniquement ses propres statistiques et transactions
      filters.userId = user.id;
      filters.allowedUserIds = [user.id];
      if (userWithRole.storeId) {
        filters.storeId = userWithRole.storeId;
        filters.allowedStoreIds = [userWithRole.storeId];
      }
      return filters;
    } else if (roleName === 'CHEF_DE_ZONE') {
      // Données de sa zone (magasins gérés et sous-acheteurs supervisés)
      // On récupère tous ses subordonnés récursifs ou directs
      const subordinates = await this.prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true, storeId: true },
      });
      
      const subIds = subordinates.map(s => s.id);
      subIds.push(user.id); // inclure lui-même
      
      const storeIds = subordinates
        .map(s => s.storeId)
        .filter((id): id is string => id !== null);
      if (userWithRole.storeId) {
        storeIds.push(userWithRole.storeId);
      }

      filters.allowedUserIds = Array.from(new Set(subIds));
      filters.allowedStoreIds = Array.from(new Set(storeIds));
      return filters;
    }

    throw new ForbiddenException("Rôle non configuré pour l'accès au tableau de bord");
  }

  // Helper pour générer l'intervalle de date selon la période
  private getDateRange(period: string, startDateStr?: string, endDateStr?: string) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate.setDate(now.getDate() - 365);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (startDateStr && endDateStr) {
          startDate = new Date(startDateStr);
          endDate = new Date(endDateStr);
        } else {
          startDate.setDate(now.getDate() - 30);
        }
        break;
      default:
        // Par défaut le dernier mois
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  // Endpoint 1 : KPIs
  async getKpis(user: any, query: any) {
    const sec = await this.getSecurityFilters(user);
    const { period, storeId, userId, planterId, startDate: sD, endDate: eD } = query;
    const { startDate, endDate } = this.getDateRange(period, sD, eD);

    // Construction du filtre global pour les requêtes
    const purchaseWhere: any = {
      createdAt: { gte: startDate, lte: endDate },
    };
    const salesWhere: any = {
      date: { gte: startDate, lte: endDate },
    };
    const creditWhere: any = {
      createdAt: { gte: startDate, lte: endDate },
    };
    const repaymentWhere: any = {
      repaidAt: { gte: startDate, lte: endDate },
    };

    // Application des filtres de sécurité & filtres de requêtes
    if (sec.storeId) {
      purchaseWhere.storeId = sec.storeId;
    } else if (sec.allowedStoreIds.length > 0) {
      purchaseWhere.storeId = { in: sec.allowedStoreIds };
    }
    if (storeId) {
      // Filtrage utilisateur additionnel
      if (!sec.storeId && (sec.allowedStoreIds.length === 0 || sec.allowedStoreIds.includes(storeId))) {
        purchaseWhere.storeId = storeId;
      }
    }

    if (sec.userId) {
      purchaseWhere.buyerId = sec.userId;
      creditWhere.subBuyerId = sec.userId;
    } else if (sec.allowedUserIds.length > 0) {
      purchaseWhere.buyerId = { in: sec.allowedUserIds };
      creditWhere.subBuyerId = { in: sec.allowedUserIds };
    }
    if (userId) {
      if (!sec.userId && (sec.allowedUserIds.length === 0 || sec.allowedUserIds.includes(userId))) {
        purchaseWhere.buyerId = userId;
        creditWhere.subBuyerId = userId;
      }
    }

    if (planterId) {
      purchaseWhere.planterId = planterId;
      creditWhere.planterId = planterId;
    }

    // --- CALCUL DES KPIS ---

    // 1. Stock (Calculé à partir des mouvements physiques)
    const stockWhere: any = {};
    if (purchaseWhere.storeId) stockWhere.storeId = purchaseWhere.storeId;
    
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: stockWhere,
      select: { quantityKg: true, bagCount: true },
    });
    
    const totalStockKg = stockMovements.reduce((acc, m) => acc + m.quantityKg, 0);
    const totalStockTonnes = totalStockKg / 1000;
    const totalSacs = stockMovements.reduce((acc, m) => acc + m.bagCount, 0);

    // Valeur estimée du stock (Prix moyen d'achat global * stock actuel)
    const avgPriceRes = await this.prisma.purchase.aggregate({
      _avg: { pricePerKg: true },
    });
    const avgPrice = avgPriceRes._avg.pricePerKg || 1500; // prix par défaut de repli
    const stockValue = totalStockKg * avgPrice;

    // 2. Achats sur la période
    const purchases = await this.prisma.purchase.findMany({
      where: purchaseWhere,
      select: { weightNetPaid: true, amountGross: true },
    });
    
    const purchasesCount = purchases.length;
    const purchasesQtyKg = purchases.reduce((acc, p) => acc + p.weightNetPaid, 0);
    const purchasesAmount = purchases.reduce((acc, p) => acc + p.amountGross, 0);

    // 3. Ventes sur la période (Uniquement Directeur & Comptable ou Global)
    let salesQtyKg = 0;
    let salesAmount = 0;
    if (sec.role === 'DIRECTEUR' || sec.role === 'COMPTABLE' || sec.role === 'ADMIN') {
      const sales = await this.prisma.sale.findMany({
        where: salesWhere,
        select: { quantityKg: true, totalAmount: true },
      });
      salesQtyKg = sales.reduce((acc, s) => acc + s.quantityKg, 0);
      salesAmount = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    }

    // 4. Trésorerie estimée (Modèle de flux de caisse virtuel basé sur transactions)
    // Caisse = Initial 10M - Achats - Crédits décaissés + Remboursements encaissés
    // Banque = Initial 50M + Ventes - Crédits décaissés Banque
    const allPurchasesSum = await this.prisma.purchase.aggregate({ _sum: { amountGross: true } });
    const allSalesSum = await this.prisma.sale.aggregate({ _sum: { totalAmount: true } });
    const allCreditsSum = await this.prisma.credit.aggregate({ _sum: { amountGranted: true } });
    const allRepaymentsSum = await this.prisma.repayment.aggregate({ _sum: { amount: true } });

    const totalPurchasesVal = allPurchasesSum._sum.amountGross || 0;
    const totalSalesVal = allSalesSum._sum.totalAmount || 0;
    const totalCreditsVal = Number(allCreditsSum._sum.amountGranted || 0);
    const totalRepaymentsVal = Number(allRepaymentsSum._sum.amount || 0);

    const soldeCaisse = 10000000 - totalPurchasesVal - (totalCreditsVal * 0.4) + totalRepaymentsVal;
    const soldeBancaire = 50000000 + totalSalesVal - (totalCreditsVal * 0.6);

    // Bénéfice brut estimé (Ventes - Coût d'achat du cacao vendu)
    // Coût moyen = avgPrice. Ventes en kg * avgPrice.
    const profitEstime = salesAmount - (salesQtyKg * avgPrice);

    // 5. Crédits en cours
    const activeCredits = await this.prisma.credit.findMany({
      where: {
        status: { in: ['ACTIVE', 'OVERDUE'] },
        ...(sec.userId ? { subBuyerId: sec.userId } : {}),
        ...(sec.allowedUserIds.length > 0 ? { subBuyerId: { in: sec.allowedUserIds } } : {}),
      },
      include: { repayments: true },
    });
    
    let totalCreditsEnCours = 0;
    activeCredits.forEach(c => {
      const repaid = c.repayments.reduce((acc, r) => acc + Number(r.amount), 0);
      totalCreditsEnCours += (Number(c.amountGranted) - repaid);
    });

    const repaymentsToday = await this.prisma.repayment.aggregate({
      where: {
        repaidAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
        ...(sec.userId ? { createdById: sec.userId } : {}),
        ...(sec.allowedUserIds.length > 0 ? { createdById: { in: sec.allowedUserIds } } : {}),
      },
      _sum: { amount: true },
    });

    // 6. Acteurs actifs
    const activePlantersCount = await this.prisma.planter.count({ where: { status: 'ACTIVE' } });
    const activeSubBuyersCount = await this.prisma.user.count({
      where: {
        status: 'ACTIVE',
        role: { name: 'SOUS_ACHETEUR' },
      },
    });
    const storesCount = await this.prisma.store.count();
    
    // Sessions actives
    const connectedUsersCount = await this.prisma.userSession.count({
      where: {
        isValid: true,
        expiresAt: { gte: new Date() },
      },
    });

    return {
      stock: {
        totalKg: totalStockKg,
        totalTonnes: totalStockTonnes,
        totalSacs: totalSacs,
        value: stockValue,
      },
      purchases: {
        count: purchasesCount,
        quantityKg: purchasesQtyKg,
        amount: purchasesAmount,
      },
      sales: {
        quantityKg: salesQtyKg,
        amount: salesAmount,
      },
      finances: {
        soldeCaisse: sec.role === 'MAGASINIER' ? null : soldeCaisse,
        soldeBancaire: sec.role === 'MAGASINIER' ? null : soldeBancaire,
        profitEstime: sec.role === 'MAGASINIER' ? null : profitEstime,
        creditsEnCours: sec.role === 'MAGASINIER' ? null : totalCreditsEnCours,
        repaymentsToday: sec.role === 'MAGASINIER' ? null : (repaymentsToday._sum.amount || 0),
      },
      actors: {
        planters: activePlantersCount,
        subBuyers: activeSubBuyersCount,
        stores: storesCount,
        connectedUsers: connectedUsersCount,
      },
    };
  }

  // Endpoint 2 : Graphiques
  async getCharts(user: any, query: any) {
    const sec = await this.getSecurityFilters(user);
    const { period, storeId, userId, planterId, startDate: sD, endDate: eD } = query;
    const { startDate, endDate } = this.getDateRange(period, sD, eD);

    const purchaseWhere: any = { createdAt: { gte: startDate, lte: endDate } };
    const salesWhere: any = { date: { gte: startDate, lte: endDate } };
    
    if (sec.storeId) purchaseWhere.storeId = sec.storeId;
    else if (sec.allowedStoreIds.length > 0) purchaseWhere.storeId = { in: sec.allowedStoreIds };
    if (storeId) purchaseWhere.storeId = storeId;

    if (sec.userId) purchaseWhere.buyerId = sec.userId;
    else if (sec.allowedUserIds.length > 0) purchaseWhere.buyerId = { in: sec.allowedUserIds };
    if (userId) purchaseWhere.buyerId = userId;

    if (planterId) purchaseWhere.planterId = planterId;

    // 1. Évolution des Achats & Ventes (Groupés par jour)
    const purchases = await this.prisma.purchase.findMany({
      where: purchaseWhere,
      orderBy: { createdAt: 'asc' },
    });

    const sales = (sec.role === 'DIRECTEUR' || sec.role === 'COMPTABLE' || sec.role === 'ADMIN') 
      ? await this.prisma.sale.findMany({ where: salesWhere, orderBy: { date: 'asc' } })
      : [];

    // Formater par jour pour Recharts
    const dateMap = new Map<string, { date: string; achats: number; ventes: number; achatsKg: number; ventesKg: number }>();
    
    // Remplir avec les achats
    purchases.forEach(p => {
      const day = p.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(day) || { date: day, achats: 0, ventes: 0, achatsKg: 0, ventesKg: 0 };
      existing.achats += p.amountGross;
      existing.achatsKg += p.weightNetPaid;
      dateMap.set(day, existing);
    });

    // Remplir avec les ventes
    sales.forEach(s => {
      const day = s.date.toISOString().split('T')[0];
      const existing = dateMap.get(day) || { date: day, achats: 0, ventes: 0, achatsKg: 0, ventesKg: 0 };
      existing.ventes += s.totalAmount;
      existing.ventesKg += s.quantityKg;
      dateMap.set(day, existing);
    });

    const evolutionData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 2. Répartition par Magasin (Top Achats)
    const storePurchases = await this.prisma.purchase.findMany({
      where: purchaseWhere,
      include: { store: true },
    });
    
    const storeMap = new Map<string, { name: string; valeur: number; quantite: number }>();
    storePurchases.forEach(p => {
      const storeName = p.store.name;
      const existing = storeMap.get(storeName) || { name: storeName, valeur: 0, quantite: 0 };
      existing.valeur += p.amountGross;
      existing.quantite += p.weightNetPaid;
      storeMap.set(storeName, existing);
    });
    const shareByStore = Array.from(storeMap.values());

    // 3. Évolution du Prix Moyen d'achat du cacao
    const priceEvolution = evolutionData.map(d => {
      const dayPurchases = purchases.filter(p => p.createdAt.toISOString().split('T')[0] === d.date);
      if (dayPurchases.length === 0) return { date: d.date, prixMoyen: 0 };
      const sumPrices = dayPurchases.reduce((acc, p) => acc + p.pricePerKg, 0);
      return {
        date: d.date,
        prixMoyen: Math.round(sumPrices / dayPurchases.length),
      };
    });

    // 4. Comparaison Crédits vs Remboursements
    const credits = await this.prisma.credit.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(sec.userId ? { subBuyerId: sec.userId } : {}),
        ...(sec.allowedUserIds.length > 0 ? { subBuyerId: { in: sec.allowedUserIds } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    const repayments = await this.prisma.repayment.findMany({
      where: {
        repaidAt: { gte: startDate, lte: endDate },
        ...(sec.userId ? { createdById: sec.userId } : {}),
        ...(sec.allowedUserIds.length > 0 ? { createdById: { in: sec.allowedUserIds } } : {}),
      },
      orderBy: { repaidAt: 'asc' },
    });

    const creditFlowMap = new Map<string, { date: string; credits: number; remboursements: number }>();
    
    credits.forEach(c => {
      const day = c.createdAt.toISOString().split('T')[0];
      const existing = creditFlowMap.get(day) || { date: day, credits: 0, remboursements: 0 };
      existing.credits += Number(c.amountGranted);
      creditFlowMap.set(day, existing);
    });

    repayments.forEach(r => {
      const day = r.repaidAt.toISOString().split('T')[0];
      const existing = creditFlowMap.get(day) || { date: day, credits: 0, remboursements: 0 };
      existing.remboursements += Number(r.amount);
      creditFlowMap.set(day, existing);
    });

    const creditEvolution = Array.from(creditFlowMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      evolution: evolutionData,
      shareByStore,
      priceEvolution,
      creditEvolution: sec.role === 'MAGASINIER' ? [] : creditEvolution,
    };
  }

  // Endpoint 3 : Alertes Système
  async getAlerts(user: any) {
    const sec = await this.getSecurityFilters(user);
    
    const where: any = { isResolved: false };
    if (sec.storeId) {
      where.storeId = sec.storeId;
    } else if (sec.allowedStoreIds.length > 0) {
      where.storeId = { in: sec.allowedStoreIds };
    }

    return this.prisma.systemAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { store: true },
    });
  }

  // Endpoint 4 : Activités Récentes (15 dernières activités)
  async getActivities(user: any) {
    const sec = await this.getSecurityFilters(user);

    // On récupère les logs d'audit et les transactions récentes
    const where: any = {};
    if (sec.userId) {
      where.userId = sec.userId;
    } else if (sec.allowedUserIds.length > 0) {
      where.userId = { in: sec.allowedUserIds };
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { user: { select: { firstName: true, lastName: true, jobTitle: true } } },
    });
  }

  // Endpoint 5 : Configuration
  async getConfig(user: any) {
    const config = await this.prisma.dashboardConfig.findUnique({
      where: { userId: user.id },
    });

    if (!config) {
      // Configuration par défaut selon le rôle
      const defaultKpis = ['stock', 'purchases', 'actors'];
      const defaultLayout = { columns: 3 };
      
      return {
        userId: user.id,
        visibleKpis: defaultKpis,
        layout: defaultLayout,
        savedViews: [],
      };
    }
    return config;
  }

  async saveConfig(user: any, body: any) {
    return this.prisma.dashboardConfig.upsert({
      where: { userId: user.id },
      update: {
        visibleKpis: body.visibleKpis,
        layout: body.layout,
        savedViews: body.savedViews || [],
      },
      create: {
        userId: user.id,
        visibleKpis: body.visibleKpis,
        layout: body.layout,
        savedViews: body.savedViews || [],
      },
    });
  }
}
