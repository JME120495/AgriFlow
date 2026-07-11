import { PrismaClient, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Début de la génération des données de test...');

  // Nettoyer les transactions existantes pour réinitialiser le seed proprement
  await prisma.inventoryItem.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.detailedStockMovement.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.lot.deleteMany({});
  await prisma.storageLocation.deleteMany({});
  await prisma.storageZone.deleteMany({});
  await prisma.warehouse.deleteMany({});

  await prisma.subBuyerLedger.deleteMany({});
  await prisma.subBuyerAdvanceJustification.deleteMany({});
  await prisma.subBuyerAdvance.deleteMany({});
  await prisma.subBuyerExpense.deleteMany({});
  await prisma.subBuyerDelivery.deleteMany({});
  await prisma.subBuyerProfile.deleteMany({});
  
  await prisma.systemAlert.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.repayment.deleteMany({});
  await prisma.credit.deleteMany({});
  await prisma.creditCategory.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.sale.deleteMany({});

  // 1. Rôles et Permissions
  const roles = [
    { name: 'ADMIN', description: 'Administrateur Système' },
    { name: 'DIRECTEUR', description: 'Direction Générale' },
    { name: 'COMPTABLE', description: 'Comptabilité et Finance' },
    { name: 'MAGASINIER', description: 'Gestion des Magasins et Stocks' },
    { name: 'CHEF_DE_ZONE', description: 'Responsable de Zone Opérationnelle' },
    { name: 'SOUS_ACHETEUR', description: 'Acheteur sur le terrain' },
  ];

  const dbRoles: any = {};
  for (const role of roles) {
    dbRoles[role.name] = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        isCustom: false,
      },
    });
  }
  console.log('[SEED] Rôles configurés.');

  // 1b. Catégories de Crédit
  const categories = [
    { code: 'PLANTER_CAMPAGNE', label: 'Avance de campagne' },
    { code: 'PLANTER_INPUTS', label: "Achat d'intrants" },
    { code: 'PLANTER_PERSONAL', label: 'Prêt personnel' },
    { code: 'SUB_BUYER_FUNDS', label: "Fonds d'achat" },
    { code: 'ZONE_MANAGER_OPS', label: 'Fonctionnement' }
  ];
  const dbCategories: any = {};
  for (const cat of categories) {
    dbCategories[cat.code] = await prisma.creditCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }
  console.log('[SEED] Catégories de crédit créées.');

  // 2. Magasins (Stores)
  const storesData = [
    {
      code: 'MAG-2026-LIT-001',
      name: 'Magasin Central Douala',
      location: 'Zone Industrielle, Douala',
      capacityKg: 100000.0,
      type: 'STOCKAGE',
      status: 'ACTIVE',
      phone: '+237600000001',
      address: 'Zone Industrielle, Douala',
      country: 'Cameroun',
      region: 'Littoral',
      city: 'Douala',
      gpsLatitude: 4.05,
      gpsLongitude: 9.70
    },
    {
      code: 'MAG-2026-EST-002',
      name: 'Magasin Régional Abengourou',
      location: 'Quartier Commerce, Abengourou',
      capacityKg: 50000.0,
      type: 'STOCKAGE',
      status: 'ACTIVE',
      phone: '+2250707070707',
      address: 'Quartier Commerce, Abengourou',
      country: "Côte d'Ivoire",
      region: 'Indénié-Djuablin',
      city: 'Abengourou',
      gpsLatitude: 6.72,
      gpsLongitude: -3.48
    },
    {
      code: 'MAG-2026-NAV-003',
      name: 'Magasin Régional Soubré',
      location: 'Sassandra-Marahoué, Soubré',
      capacityKg: 60000.0,
      type: 'STOCKAGE',
      status: 'ACTIVE',
      phone: '+2250707070708',
      address: 'Zone Industrielle, Soubré',
      country: "Côte d'Ivoire",
      region: 'La Nawa',
      city: 'Soubré',
      gpsLatitude: 5.79,
      gpsLongitude: -6.60
    },
  ];

  const dbStores = [];
  for (const store of storesData) {
    const s = await prisma.store.upsert({
      where: { name: store.name },
      update: {
        code: store.code,
        capacityKg: store.capacityKg,
        type: store.type as any,
        status: store.status as any,
        phone: store.phone,
        address: store.address,
        country: store.country,
        region: store.region,
        city: store.city,
        gpsLatitude: store.gpsLatitude,
        gpsLongitude: store.gpsLongitude,
      },
      create: {
        code: store.code,
        name: store.name,
        location: store.location,
        capacityKg: store.capacityKg,
        type: store.type as any,
        status: store.status as any,
        phone: store.phone,
        address: store.address,
        country: store.country,
        region: store.region,
        city: store.city,
        gpsLatitude: store.gpsLatitude,
        gpsLongitude: store.gpsLongitude,
      },
    });
    dbStores.push(s);
  }
  console.log('[SEED] Magasins créés.');

  // 3. Utilisateurs de test
  const passwordHash = await argon2.hash('Password123!');

  // Directeur
  const dirUser = await prisma.user.upsert({
    where: { email: 'dir@agriflow.com' },
    update: {},
    create: {
      email: 'dir@agriflow.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      passwordHash,
      jobTitle: 'Directeur Général',
      roleId: dbRoles['DIRECTEUR'].id,
      hireDate: new Date('2025-01-01'),
      status: UserStatus.ACTIVE,
    },
  });

  // Comptable
  const compUser = await prisma.user.upsert({
    where: { email: 'compta@agriflow.com' },
    update: {},
    create: {
      email: 'compta@agriflow.com',
      firstName: 'Alice',
      lastName: 'Koffi',
      passwordHash,
      jobTitle: 'Chef Comptable',
      roleId: dbRoles['COMPTABLE'].id,
      hireDate: new Date('2025-02-15'),
      status: UserStatus.ACTIVE,
    },
  });

  // Chef de Zone (superviseur)
  const chefZone = await prisma.user.upsert({
    where: { email: 'chef.zone@agriflow.com' },
    update: {},
    create: {
      email: 'chef.zone@agriflow.com',
      firstName: 'Mamadou',
      lastName: 'Diallo',
      passwordHash,
      jobTitle: 'Chef de Zone Est',
      roleId: dbRoles['CHEF_DE_ZONE'].id,
      hireDate: new Date('2025-03-01'),
      status: UserStatus.ACTIVE,
      storeId: dbStores[1].id, // Abengourou
    },
  });

  // Sous-acheteur 1 (géré par chef de zone)
  const sousAcheteur1 = await prisma.user.upsert({
    where: { email: 'acheteur1@agriflow.com' },
    update: {},
    create: {
      email: 'acheteur1@agriflow.com',
      firstName: 'Kouassi',
      lastName: 'Yao',
      passwordHash,
      jobTitle: 'Sous-Acheteur Abengourou',
      roleId: dbRoles['SOUS_ACHETEUR'].id,
      managerId: chefZone.id,
      storeId: dbStores[1].id,
      hireDate: new Date('2025-04-01'),
      status: UserStatus.ACTIVE,
    },
  });

  // Profil associé
  const profile = await prisma.subBuyerProfile.create({
    data: {
      userId: sousAcheteur1.id,
      gender: 'M',
      birthDate: new Date('1985-06-15'),
      phoneSecondary: '+2250102030405',
      idType: 'CNI',
      idNumber: 'CI009876543',
      idExpiryDate: new Date('2030-12-31'),
      idFrontUrl: '',
      idBackUrl: '',
      purchaseZone: 'Zone Est Soubré',
      region: 'La Nawa',
      department: 'Soubré',
      district: 'Soubré',
      mainVillage: 'Kpéhiri',
      creditLimit: 5000000.0,
      collaborationStartDate: new Date('2025-04-01'),
    },
  });

  // Magasinier 1
  const magasinier1 = await prisma.user.upsert({
    where: { email: 'maga1@agriflow.com' },
    update: {},
    create: {
      email: 'maga1@agriflow.com',
      firstName: 'Toussaint',
      lastName: 'Boli',
      passwordHash,
      jobTitle: 'Magasinier Abengourou',
      roleId: dbRoles['MAGASINIER'].id,
      storeId: dbStores[1].id,
      hireDate: new Date('2025-05-01'),
      status: UserStatus.ACTIVE,
    },
  });

  console.log('[SEED] Utilisateurs de test créés. Password par défaut : Password123!');

  // 4. Planteurs (Planters)
  const plantersData = [
    { code: 'PL-2026-0001', firstName: 'Alassane', lastName: 'Ouattara', phone: '+2250707070701', storeId: dbStores[1].id, village: 'Village Abron' },
    { code: 'PL-2026-0002', firstName: 'Koffi', lastName: 'Kouamé', phone: '+2250707070702', storeId: dbStores[1].id, village: 'Campement Yao' },
    { code: 'PL-2026-0003', firstName: 'Didier', lastName: 'Drogba', phone: '+2250707070703', storeId: dbStores[2].id, village: 'Basse-Sassandra' },
    { code: 'PL-2026-0004', firstName: 'Yaya', lastName: 'Touré', phone: '+2250707070704', storeId: dbStores[2].id, village: 'Basse-Sassandra' },
  ];

  const dbPlanters = [];
  for (const planter of plantersData) {
    const p = await prisma.planter.upsert({
      where: { phone: planter.phone },
      update: {},
      create: {
        code: planter.code,
        firstName: planter.firstName,
        lastName: planter.lastName,
        phone: planter.phone,
        status: UserStatus.ACTIVE,
        storeId: planter.storeId,
        gender: 'M',
        plantation: {
          create: {
            name: `Plantation de ${planter.firstName}`,
            location: planter.village,
            areaHectares: 10.0,
            parcelsCount: 2,
            treesCount: 6000,
            creationYear: 2018,
            variety: 'Mercedes',
            latitude: 6.7291,
            longitude: -3.4839
          }
        }
      },
    });
    dbPlanters.push(p);
  }
  console.log('[SEED] Planteurs créés.');


  // 5. Génération d'Historique de Transactions sur 30 jours
  const now = new Date();
  const buyerId = sousAcheteur1.id;
  const storeId = dbStores[1].id; // Abengourou

  console.log('[SEED] Génération des avances et relevés financiers des sous-acheteurs...');
  
  // Crée une avance de départ
  const initAdvance = await prisma.subBuyerAdvance.create({
    data: {
      code: 'AV-2026-06-0001',
      subBuyerProfileId: profile.id,
      amount: 4000000.0,
      remainingAmount: 500000.0,
      reason: 'ACHAT_CACAO',
      paymentMethod: 'MOBILE_MONEY',
      status: 'PARTIALLY_JUSTIFIED',
      validatedById: compUser.id,
      date: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subBuyerLedger.create({
    data: {
      subBuyerProfileId: profile.id,
      type: 'CREDIT',
      amount: 4000000.0,
      balance: 4000000.0,
      advanceId: initAdvance.id,
      description: "Avance de début de mois pour achats de cacao",
      date: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  // Crée une dépense
  const initExpense = await prisma.subBuyerExpense.create({
    data: {
      subBuyerProfileId: profile.id,
      amount: 150000.0,
      category: 'TRANSPORT',
      description: "Location camionnette pour piste de brousse",
      status: 'APPROVED',
      validatedById: compUser.id,
      date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subBuyerLedger.create({
    data: {
      subBuyerProfileId: profile.id,
      type: 'DEBIT',
      amount: 150000.0,
      balance: 3850000.0,
      expenseId: initExpense.id,
      description: "Justification de dépense validée : Location camionnette",
      date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  // Livraison validée
  const deliveryVal = await prisma.subBuyerDelivery.create({
    data: {
      code: 'LIV-2026-06-0001',
      subBuyerProfileId: profile.id,
      storeId,
      deliveryDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      declaredQuantityKg: 2000.0,
      declaredBagCount: 31,
      receivedQuantityKg: 1980.0,
      receivedBagCount: 31,
      lossQuantityKg: 20.0,
      lossPercentage: 1.0,
      moistureContent: 7.4,
      subgradePercentage: 0.8,
      status: 'VALIDATED',
      magasinierId: magasinier1.id,
      notes: "Livraison reçue conforme, perte de 1% dans les tolérances.",
    },
  });

  // Imputation financière de la livraison : 1980 Kg * 1800 FCFA = 3 564 000 FCFA
  await prisma.subBuyerLedger.create({
    data: {
      subBuyerProfileId: profile.id,
      type: 'DEBIT',
      amount: 3564000.0,
      balance: 286000.0,
      deliveryId: deliveryVal.id,
      description: "Livraison validée au magasin Réf: LIV-2026-06-0001",
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    },
  });

  // Une livraison en litige (perte élevée)
  const deliveryLit = await prisma.subBuyerDelivery.create({
    data: {
      code: 'LIV-2026-06-0002',
      subBuyerProfileId: profile.id,
      storeId,
      deliveryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      declaredQuantityKg: 1500.0,
      declaredBagCount: 23,
      receivedQuantityKg: 1440.0,
      receivedBagCount: 23,
      lossQuantityKg: 60.0,
      lossPercentage: 4.0,
      moistureContent: 8.2,
      subgradePercentage: 1.5,
      status: 'LITIGATION',
      magasinierId: magasinier1.id,
      alertTriggered: true,
      notes: "Humidité trop élevée et perte de poids anormale de 4% (60 Kg manquants). Dossier en litige.",
    },
  });

  await prisma.systemAlert.create({
    data: {
      type: 'SUSPICIOUS_TRANSACTION',
      severity: 'CRITICAL',
      message: `Écart important de pesée sur livraison Réf: LIV-2026-06-0002 du sous-acheteur Kouassi Yao. Perte : 60 Kg (4.00%).`,
      storeId,
      userId: sousAcheteur1.id,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('[SEED] Génération des achats, ventes et crédits...');

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);

    // Achats (1 à 3 par jour)
    const purchaseCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < purchaseCount; j++) {
      const planter = dbPlanters[Math.floor(Math.random() * dbPlanters.length)];
      const quantityKg = Math.floor(Math.random() * 800) + 150; // 150 - 950 kg
      const bagCount = Math.ceil(quantityKg / 65); // 65kg par sac env
      const pricePerKg = 1500 + Math.floor(Math.random() * 100) - 50; // 1450 - 1550 FCFA
      const totalAmount = quantityKg * pricePerKg;

      const p = await prisma.purchase.create({
        data: {
          purchaseNumber: `ACH-${i}-${j}-${Math.floor(Math.random() * 100000)}`,
          campaign: '2025/2026',
          planterId: planter.id,
          buyerId,
          storeId,
          bagCount,
          packagingType: 'JUTE',
          weightGross: quantityKg + bagCount,
          weightBags: bagCount,
          weightNet: quantityKg,
          moistureRate: 7.5,
          impurityRate: 0.8,
          moldyRate: 0.2,
          slatyRate: 0.5,
          insectRate: 0.0,
          grainage: 95,
          weightRefactionKg: 0.0,
          weightNetPaid: quantityKg,
          pricePerKg,
          amountGross: totalAmount,
          amountNetPaid: totalAmount,
          status: 'PAID',
          createdAt: date,
        },
      });

      // Mouvement de stock associé (entrée)
      await prisma.stockMovement.create({
        data: {
          storeId,
          quantityKg,
          bagCount,
          type: 'PURCHASE',
          referenceId: p.id,
          createdById: buyerId,
          date,
        },
      });
    }

    // Ventes (Tous les 4 jours)
    if (i % 4 === 0) {
      const quantityKg = Math.floor(Math.random() * 5000) + 2000; // 2t à 7t
      const bagCount = Math.ceil(quantityKg / 65);
      const pricePerKg = 1850; // Vente exportateur
      const totalAmount = quantityKg * pricePerKg;

      const s = await prisma.sale.create({
        data: {
          buyerName: 'CARGILL CACAO CI',
          quantityKg,
          bagCount,
          pricePerKg,
          totalAmount,
          createdById: dirUser.id,
          date,
        },
      });

      // Mouvement de stock associé (sortie du magasin régional)
      await prisma.stockMovement.create({
        data: {
          storeId,
          quantityKg: -quantityKg,
          bagCount: -bagCount,
          type: 'SALE',
          referenceId: s.id,
          createdById: dirUser.id,
          date,
        },
      });
    }

    // Crédits (Uniquement tous les 5 jours)
    if (i % 5 === 0) {
      const planter = dbPlanters[Math.floor(Math.random() * dbPlanters.length)];
      const amount = Math.floor(Math.random() * 150000) + 50000; // 50k - 200k FCFA
      const dueDate = new Date(date);
      dueDate.setDate(date.getDate() + 30); // 30 jours après

      const credit = await prisma.credit.create({
        data: {
          creditNumber: `CR-${i}-${Math.floor(Math.random() * 100000)}`,
          beneficiaryType: 'PLANTER',
          beneficiaryId: planter.id,
          categoryId: dbCategories['PLANTER_INPUTS'].id,
          amountGranted: amount,
          balance: amount,
          dueDate,
          status: 'ACTIVE',
          planterId: planter.id,
          createdById: compUser.id,
          grantedAt: date,
          paymentMethod: 'CASH',
          sourceAccount: 'Caisse Centrale',
          createdAt: date,
        },
      });

      // Remboursement partiel ou total pour les anciens crédits
      if (i > 10) {
        const isPaid = Math.random() > 0.3;
        const repaymentAmount = isPaid ? amount : amount * 0.5;
        
        await prisma.repayment.create({
          data: {
            creditId: credit.id,
            amount: repaymentAmount,
            userId: compUser.id,
            repaidAt: new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 jours après
            paymentMethod: 'CASH',
          },
        });

        await prisma.credit.update({
          where: { id: credit.id },
          data: {
            status: isPaid ? 'REPAID' : 'ACTIVE',
            amountRepaid: repaymentAmount,
            balance: amount - repaymentAmount,
          },
        });
      }
    }
  }

  // 6. Génération des Alertes Système
  // Alerte stock faible
  await prisma.systemAlert.create({
    data: {
      type: 'LOW_STOCK',
      severity: 'WARNING',
      message: 'Le stock de cacao dans le Magasin Régional Soubré est inférieur à 10 tonnes (actuellement 3.5 tonnes).',
      storeId: dbStores[2].id,
    },
  });

  // Alerte crédit en retard
  const latePlanter = dbPlanters[0];
  const lateDate = new Date();
  lateDate.setDate(now.getDate() - 40); // accordé il y a 40 jours
  const lateDueDate = new Date();
  lateDueDate.setDate(now.getDate() - 10); // dû il y a 10 jours
  
  const lateCredit = await prisma.credit.create({
    data: {
      creditNumber: `CR-LATE-${Math.floor(Math.random() * 100000)}`,
      beneficiaryType: 'PLANTER',
      beneficiaryId: latePlanter.id,
      categoryId: dbCategories['PLANTER_INPUTS'].id,
      amountGranted: 120000,
      balance: 120000,
      dueDate: lateDueDate,
      status: 'OVERDUE',
      planterId: latePlanter.id,
      createdById: compUser.id,
      grantedAt: lateDate,
      paymentMethod: 'CASH',
      sourceAccount: 'Caisse Centrale',
      createdAt: lateDate,
    },
  });

  await prisma.systemAlert.create({
    data: {
      type: 'OVERDUE_CREDIT',
      severity: 'CRITICAL',
      message: `Le crédit de 120 000 FCFA accordé à ${latePlanter.firstName} ${latePlanter.lastName} est en retard de 10 jours.`,
    },
  });

  // Alerte Magasin presque plein
  await prisma.systemAlert.create({
    data: {
      type: 'WAREHOUSE_FULL',
      severity: 'WARNING',
      message: 'Le Magasin Régional Abengourou est rempli à 92% de sa capacité maximale.',
      storeId: dbStores[1].id,
    },
  });

  // Seed des règles de réfaction par défaut
  const defaultRules = [
    {
      code: 'HUMIDITE',
      name: 'Humidité du cacao',
      threshold: 8.0,
      penaltyType: 'PERCENT_WEIGHT',
      penaltyValue: 1.0,
      formula: 'metrics.moistureRate > 10.0 ? (metrics.moistureRate - 8.0) * 2.0 : (metrics.moistureRate - 8.0)',
      maxLimit: 12.0,
    },
    {
      code: 'DECHETS',
      name: 'Taux de déchets et impuretés',
      threshold: 1.0,
      penaltyType: 'PERCENT_WEIGHT',
      penaltyValue: 1.0,
      formula: 'metrics.impurityRate - 1.0',
      maxLimit: 5.0,
    },
    {
      code: 'MOISIES',
      name: 'Fèves moisies',
      threshold: 3.0,
      penaltyType: 'PERCENT_WEIGHT',
      penaltyValue: 0.5,
      formula: '(metrics.moldyRate - 3.0) * 0.5',
      maxLimit: 10.0,
    },
  ];

  for (const r of defaultRules) {
    const existing = await prisma.refactionRule.findFirst({
      where: { code: r.code, campaign: '2025/2026', storeId: null, clientExport: null },
    });
    if (!existing) {
      await prisma.refactionRule.create({
        data: {
          code: r.code,
          name: r.name,
          threshold: r.threshold,
          penaltyType: r.penaltyType as any,
          penaltyValue: r.penaltyValue,
          formula: r.formula,
          maxLimit: r.maxLimit,
          campaign: '2025/2026',
          isActive: true,
        },
      });
    }
  }
  console.log('[SEED] Règles de réfaction par défaut créées.');

  // Créer des contrôles qualité pour les achats existants
  const allPurchases = await prisma.purchase.findMany({ take: 10 });
  for (const p of allPurchases) {
    const hasQc = await prisma.qualityControl.findUnique({
      where: { purchaseId: p.id },
    });
    if (!hasQc) {
      await prisma.qualityControl.create({
        data: {
          controlNumber: `QC-${p.purchaseNumber.replace('ACH-', '')}`,
          status: 'VALIDATED',
          purchaseId: p.id,
          moistureRate: p.moistureRate,
          impurityRate: p.impurityRate,
          moldyRate: p.moldyRate,
          slatyRate: p.slatyRate,
          insectRate: p.insectRate,
          brokenRate: 1.0,
          flatRate: 1.0,
          germinatedRate: 0.0,
          grainage: p.grainage,
          wetBagsCount: 0,
          smell: 'CONFORME',
          color: 'CONFORME',
          bagCondition: 'PROPRE',
          weightRefactionKg: p.weightRefactionKg,
          financialLossFCFA: p.weightRefactionKg * p.pricePerKg,
          controlledById: p.buyerId,
          validatedById: p.buyerId,
          createdAt: p.createdAt,
        },
      });
    }
  }
  console.log('[SEED] Contrôles qualité de test générés.');

  // --- MODULE 9 : MAGASINS & ENTREPOTS SEEDING ---
  console.log('[SEED] Début du seeding du Module 9 (Magasins & Entrepôts)...');

  // Associer le magasinier au magasin d'Abengourou (dbStores[1])
  const abengourouStore = dbStores[1];
  await prisma.store.update({
    where: { id: abengourouStore.id },
    data: { responsibleId: magasinier1.id }
  });

  // 1. Entrepôts
  const whA = await prisma.warehouse.create({
    data: {
      storeId: abengourouStore.id,
      name: 'Entrepôt A - Principal',
      capacityTonnes: 100.0,
    }
  });

  const whB = await prisma.warehouse.create({
    data: {
      storeId: abengourouStore.id,
      name: 'Entrepôt B - Secondaire',
      capacityTonnes: 50.0,
    }
  });

  // 2. Zones de stockage
  const zoneA1 = await prisma.storageZone.create({
    data: {
      warehouseId: whA.id,
      name: 'Zone A1 - Grade 1 Certifié',
      cocoaGrade: 'GRADE_1',
    }
  });

  const zoneA2 = await prisma.storageZone.create({
    data: {
      warehouseId: whA.id,
      name: 'Zone A2 - Grade 2 Standard',
      cocoaGrade: 'GRADE_2',
    }
  });

  const zoneB1 = await prisma.storageZone.create({
    data: {
      warehouseId: whB.id,
      name: 'Zone B1 - Vrac Sous-Grade',
      cocoaGrade: 'SOUS_GRADE',
    }
  });

  // 3. Emplacements (Locations)
  const locCodesA1 = ['LOC-A-01', 'LOC-A-02', 'LOC-A-03', 'LOC-A-04'];
  const locations = [];

  for (const code of locCodesA1) {
    const loc = await prisma.storageLocation.create({
      data: {
        zoneId: zoneA1.id,
        code,
        capacityKg: 10000.0,
        currentWeightKg: code === 'LOC-A-01' ? 4500.0 : code === 'LOC-A-02' ? 6200.0 : 0.0,
        currentBags: code === 'LOC-A-01' ? 70 : code === 'LOC-A-02' ? 95 : 0,
      }
    });
    locations.push(loc);
  }

  const locCodesA2 = ['LOC-A-05', 'LOC-A-06'];
  for (const code of locCodesA2) {
    const loc = await prisma.storageLocation.create({
      data: {
        zoneId: zoneA2.id,
        code,
        capacityKg: 8000.0,
        currentWeightKg: code === 'LOC-A-05' ? 3000.0 : 0.0,
        currentBags: code === 'LOC-A-05' ? 45 : 0,
      }
    });
    locations.push(loc);
  }

  const locCodesB1 = ['LOC-B-01', 'LOC-B-02'];
  for (const code of locCodesB1) {
    const loc = await prisma.storageLocation.create({
      data: {
        zoneId: zoneB1.id,
        code,
        capacityKg: 15000.0,
        currentWeightKg: 0.0,
        currentBags: 0,
      }
    });
    locations.push(loc);
  }

  console.log('[SEED] Entrepôts, Zones et Emplacements créés.');

  // 4. Mouvements de stock détaillés (DetailedStockMovements)
  await prisma.detailedStockMovement.create({
    data: {
      type: 'IN_PURCHASE',
      weightKg: 4500.0,
      bagCount: 70,
      destLocationId: locations[0].id, // LOC-A-01
      storeId: abengourouStore.id,
      createdById: magasinier1.id,
      date: new Date(),
    }
  });

  await prisma.detailedStockMovement.create({
    data: {
      type: 'IN_PURCHASE',
      weightKg: 6200.0,
      bagCount: 95,
      destLocationId: locations[1].id, // LOC-A-02
      storeId: abengourouStore.id,
      createdById: magasinier1.id,
      date: new Date(),
    }
  });

  // Transfert interne de LOC-A-02 vers LOC-A-05
  await prisma.detailedStockMovement.create({
    data: {
      type: 'INTERNAL_TRANSFER',
      weightKg: 3000.0,
      bagCount: 45,
      sourceLocationId: locations[1].id, // LOC-A-02
      destLocationId: locations[4].id, // LOC-A-05
      storeId: abengourouStore.id,
      createdById: magasinier1.id,
      date: new Date(),
    }
  });

  console.log('[SEED] Mouvements de stock détaillés créés.');

  // 5. Fiche d'inventaire de test
  const inv = await prisma.inventory.create({
    data: {
      inventoryNumber: 'INV-202607-0001',
      status: 'PENDING_APPROVAL',
      storeId: abengourouStore.id,
      createdById: magasinier1.id,
      startDate: new Date(),
      gapComment: "Léger écart de dessiccateur (perte d'humidité naturelle).",
    }
  });

  // Rapprochement sur LOC-A-01
  await prisma.inventoryItem.create({
    data: {
      inventoryId: inv.id,
      locationId: locations[0].id, // LOC-A-01
      theoreticalWeight: 4500.0,
      theoreticalBags: 70,
      physicalWeight: 4492.0, // écart négatif de 8kg
      physicalBags: 70,
      weightGap: -8.0,
      bagsGap: 0,
    }
  });

  // Rapprochement sur LOC-A-02
  await prisma.inventoryItem.create({
    data: {
      inventoryId: inv.id,
      locationId: locations[1].id, // LOC-A-02
      theoreticalWeight: 3200.0, // original 6200 - 3000 transférés
      theoreticalBags: 50,
      physicalWeight: 3200.0,
      physicalBags: 50,
      weightGap: 0.0,
      bagsGap: 0,
    }
  });

  console.log('[SEED] Fiche d\'inventaire de test créée.');

  // 6. Seeding du Module 10 (Gestion des Stocks - Lots et Réservations)
  console.log('[SEED] Début du seeding du Module 10 (Lots et Réservations)...');

  // Lot 1 : Disponible
  const lot1 = await prisma.lot.create({
    data: {
      numeroLot: 'LOT-2026-07-001',
      campagne: '2025/2026',
      qualite: 'GRADE_1',
      poidsInitial: 4500.0,
      poidsActuel: 4500.0,
      nombreSacs: 70,
      valeurAchat: 6750000.0,
      valeurActuelle: 6750000.0,
      emplacementId: locations[0].id, // LOC-A-01
      status: 'DISPONIBLE',
    }
  });

  // Lot 2 : Disponible
  const lot2 = await prisma.lot.create({
    data: {
      numeroLot: 'LOT-2026-07-002',
      campagne: '2025/2026',
      qualite: 'GRADE_2',
      poidsInitial: 3000.0,
      poidsActuel: 3000.0,
      nombreSacs: 45,
      valeurAchat: 4425000.0,
      valeurActuelle: 4425000.0,
      emplacementId: locations[4].id, // LOC-A-05
      status: 'DISPONIBLE',
    }
  });

  // Lot 3 : Réservé
  const lot3 = await prisma.lot.create({
    data: {
      numeroLot: 'LOT-2026-07-003',
      campagne: '2025/2026',
      qualite: 'GRADE_1',
      poidsInitial: 3200.0,
      poidsActuel: 3200.0,
      nombreSacs: 50,
      valeurAchat: 4800000.0,
      valeurActuelle: 4800000.0,
      emplacementId: locations[1].id, // LOC-A-02
      status: 'RESERVE',
    }
  });

  // Lot 4 : Bloqué
  const lot4 = await prisma.lot.create({
    data: {
      numeroLot: 'LOT-2026-07-004',
      campagne: '2025/2026',
      qualite: 'GRADE_2',
      poidsInitial: 1200.0,
      poidsActuel: 1200.0,
      nombreSacs: 18,
      valeurAchat: 1770000.0,
      valeurActuelle: 1770000.0,
      emplacementId: locations[2].id, // LOC-A-03
      status: 'BLOQUE',
    }
  });

  // Mettre à jour les mouvements de stock détaillés pour lier les lots si besoin
  await prisma.detailedStockMovement.updateMany({
    where: { destLocationId: locations[0].id },
    data: { lotId: lot1.id }
  });

  await prisma.detailedStockMovement.updateMany({
    where: { destLocationId: locations[4].id },
    data: { lotId: lot2.id }
  });

  // Réservation associée au Lot 3
  await prisma.reservation.create({
    data: {
      lotId: lot3.id,
      quantite: 3200.0,
      motif: 'Réservation Exportation Cargo Soubré #45A',
      statut: 'ACTIVE',
      utilisateurId: magasinier1.id,
    }
  });

  console.log('[SEED] Lots de cacao et Réservations créés.');

  console.log('[SEED] Alertes système générées.');
  console.log('[SEED] Base de données de test peuplée avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
