"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('[SEED] Début de la génération des données de test...');
    // 1. Rôles et Permissions
    const roles = [
        { name: 'ADMIN', description: 'Administrateur Système' },
        { name: 'DIRECTEUR', description: 'Direction Générale' },
        { name: 'COMPTABLE', description: 'Comptabilité et Finance' },
        { name: 'MAGASINIER', description: 'Gestion des Magasins et Stocks' },
        { name: 'CHEF_DE_ZONE', description: 'Responsable de Zone Opérationnelle' },
        { name: 'SOUS_ACHETEUR', description: 'Acheteur sur le terrain' },
    ];
    const dbRoles = {};
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
    // 2. Magasins (Stores)
    const storesData = [
        { name: 'Magasin Central Douala', location: 'Zone Industrielle, Douala', capacityKg: 100000.0 },
        { name: 'Magasin Régional Abengourou', location: 'Quartier Commerce, Abengourou', capacityKg: 50000.0 },
        { name: 'Magasin Régional Soubré', location: 'Sassandra-Marahoué, Soubré', capacityKg: 60000.0 },
    ];
    const dbStores = [];
    for (const store of storesData) {
        const s = await prisma.store.upsert({
            where: { name: store.name },
            update: { capacityKg: store.capacityKg },
            create: {
                name: store.name,
                location: store.location,
                capacityKg: store.capacityKg,
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
            status: client_1.UserStatus.ACTIVE,
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
            status: client_1.UserStatus.ACTIVE,
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
            status: client_1.UserStatus.ACTIVE,
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
            status: client_1.UserStatus.ACTIVE,
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
            status: client_1.UserStatus.ACTIVE,
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
                status: client_1.UserStatus.ACTIVE,
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
    // Nettoyer les transactions existantes pour réinitialiser le seed proprement
    await prisma.systemAlert.deleteMany({});
    await prisma.stockMovement.deleteMany({});
    await prisma.repayment.deleteMany({});
    await prisma.credit.deleteMany({});
    await prisma.purchase.deleteMany({});
    await prisma.sale.deleteMany({});
    // 5. Génération d'Historique de Transactions sur 30 jours
    const now = new Date();
    const buyerId = sousAcheteur1.id;
    const storeId = dbStores[1].id; // Abengourou
    console.log('[SEED] Génération des achats, ventes et crédits...');
    for (let i = 30; i >= 0; i--) {
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
                    planterId: planter.id,
                    buyerId,
                    storeId,
                    quantityKg,
                    bagCount,
                    pricePerKg,
                    totalAmount,
                    date,
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
                    amount,
                    interestRate: 0.0,
                    dueDate,
                    status: 'PENDING',
                    planterId: planter.id,
                    createdById: compUser.id,
                    createdAt: date,
                },
            });
            // Remboursement partiel ou total pour les anciens crédits
            if (i > 10) {
                const isPaid = Math.random() > 0.3;
                const repaymentAmount = isPaid ? amount : amount * 0.5;
                const rep = await prisma.repayment.create({
                    data: {
                        creditId: credit.id,
                        amount: repaymentAmount,
                        createdById: compUser.id,
                        date: new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 jours après
                    },
                });
                await prisma.credit.update({
                    where: { id: credit.id },
                    data: {
                        status: isPaid ? 'PAID' : 'PARTIALLY_PAID',
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
            amount: 120000,
            interestRate: 0.0,
            dueDate: lateDueDate,
            status: 'OVERDUE',
            planterId: latePlanter.id,
            createdById: compUser.id,
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
