import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWarehouseDto,
  CreateStorageZoneDto,
  CreateStorageLocationDto,
  CreateStockMovementDto,
  CreateInventoryDto,
  SubmitInventoryItemDto,
} from './dto/create-warehouse.dto';
import { StockMovementType, InventoryStatus } from '@prisma/client';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  // ─── MAGASINS (Stores) ────────────────────────────────────────────────

  async findAllStores(query: any) {
    const { search, status } = query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const stores = await this.prisma.store.findMany({
      where,
      include: {
        responsible: { select: { id: true, firstName: true, lastName: true } },
        warehouses: {
          include: {
            storageZones: {
              include: {
                locations: true,
              },
            },
          },
        },
        _count: {
          select: {
            purchases: true,
            detailedStockMovements: true,
            inventories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculer les métriques de capacité pour chaque magasin
    return stores.map((store) => {
      let currentWeightKg = 0;
      let currentBags = 0;
      let totalLocationCapacity = 0;
      let locationCount = 0;

      store.warehouses.forEach((wh) => {
        wh.storageZones.forEach((zone) => {
          zone.locations.forEach((loc) => {
            currentWeightKg += loc.currentWeightKg;
            currentBags += loc.currentBags;
            totalLocationCapacity += loc.capacityKg;
            locationCount++;
          });
        });
      });

      const occupancyRate = store.capacityKg > 0
        ? Math.round((currentWeightKg / store.capacityKg) * 100 * 10) / 10
        : 0;

      return {
        ...store,
        metrics: {
          currentWeightKg: Math.round(currentWeightKg * 100) / 100,
          currentWeightTonnes: Math.round(currentWeightKg / 10) / 100,
          currentBags,
          occupancyRate,
          totalLocationCapacity,
          locationCount,
          warehouseCount: store.warehouses.length,
        },
      };
    });
  }

  async findStoreById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        responsible: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        warehouses: {
          include: {
            storageZones: {
              include: {
                locations: {
                  orderBy: { code: 'asc' },
                },
              },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
        inventories: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
            validatedBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!store) throw new NotFoundException('Magasin introuvable.');

    // Calculer les métriques
    let currentWeightKg = 0;
    let currentBags = 0;
    let totalLocationCapacity = 0;

    store.warehouses.forEach((wh) => {
      wh.storageZones.forEach((zone) => {
        zone.locations.forEach((loc) => {
          currentWeightKg += loc.currentWeightKg;
          currentBags += loc.currentBags;
          totalLocationCapacity += loc.capacityKg;
        });
      });
    });

    const occupancyRate = store.capacityKg > 0
      ? Math.round((currentWeightKg / store.capacityKg) * 100 * 10) / 10
      : 0;

    // Derniers mouvements de stock
    const recentMovements = await this.prisma.detailedStockMovement.findMany({
      where: { storeId: id },
      take: 20,
      orderBy: { date: 'desc' },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        sourceLocation: { select: { code: true } },
        destLocation: { select: { code: true } },
      },
    });

    return {
      ...store,
      metrics: {
        currentWeightKg: Math.round(currentWeightKg * 100) / 100,
        currentWeightTonnes: Math.round(currentWeightKg / 10) / 100,
        currentBags,
        occupancyRate,
        totalLocationCapacity,
        warehouseCount: store.warehouses.length,
      },
      recentMovements,
    };
  }

  // ─── ENTREPÔTS (Warehouses) ───────────────────────────────────────────

  async createWarehouse(dto: CreateWarehouseDto) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store) throw new NotFoundException('Magasin introuvable.');

    return this.prisma.warehouse.create({
      data: {
        storeId: dto.storeId,
        name: dto.name,
        capacityTonnes: dto.capacityTonnes,
      },
    });
  }

  // ─── ZONES DE STOCKAGE ────────────────────────────────────────────────

  async createStorageZone(dto: CreateStorageZoneDto) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new NotFoundException('Entrepôt introuvable.');

    return this.prisma.storageZone.create({
      data: {
        warehouseId: dto.warehouseId,
        name: dto.name,
        cocoaGrade: dto.cocoaGrade || 'GRADE_1',
      },
    });
  }

  // ─── EMPLACEMENTS DE STOCKAGE ─────────────────────────────────────────

  async createStorageLocation(dto: CreateStorageLocationDto) {
    const zone = await this.prisma.storageZone.findUnique({ where: { id: dto.zoneId } });
    if (!zone) throw new NotFoundException('Zone de stockage introuvable.');

    // Vérifier l'unicité du code
    const existing = await this.prisma.storageLocation.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Le code emplacement "${dto.code}" existe déjà.`);

    return this.prisma.storageLocation.create({
      data: {
        zoneId: dto.zoneId,
        code: dto.code,
        capacityKg: dto.capacityKg,
      },
    });
  }

  // ─── MOUVEMENTS DE STOCK ──────────────────────────────────────────────

  async createStockMovement(dto: CreateStockMovementDto, userId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store) throw new NotFoundException('Magasin introuvable.');

    // Valider le type de mouvement
    const validTypes: StockMovementType[] = [
      StockMovementType.IN_PURCHASE,
      StockMovementType.OUT_SALE,
      StockMovementType.INTERNAL_TRANSFER,
      StockMovementType.INTER_STORE_TRANSFER,
      StockMovementType.INVENTORY_CORRECTION,
    ];
    if (!validTypes.includes(dto.type as StockMovementType)) {
      throw new BadRequestException(`Type de mouvement invalide: ${dto.type}`);
    }

    // Traitement transactionnel
    return this.prisma.$transaction(async (tx) => {
      // Si sortie → diminuer le stock de l'emplacement source
      if (dto.sourceLocationId) {
        const sourceLoc = await tx.storageLocation.findUnique({ where: { id: dto.sourceLocationId } });
        if (!sourceLoc) throw new NotFoundException('Emplacement source introuvable.');
        if (sourceLoc.currentWeightKg < dto.weightKg) {
          throw new BadRequestException(
            `Stock insuffisant dans l'emplacement ${sourceLoc.code}. Disponible: ${sourceLoc.currentWeightKg} kg, Demandé: ${dto.weightKg} kg`,
          );
        }
        await tx.storageLocation.update({
          where: { id: dto.sourceLocationId },
          data: {
            currentWeightKg: { decrement: dto.weightKg },
            currentBags: { decrement: dto.bagCount },
          },
        });
      }

      // Si entrée → augmenter le stock de l'emplacement destination
      if (dto.destLocationId) {
        const destLoc = await tx.storageLocation.findUnique({ where: { id: dto.destLocationId } });
        if (!destLoc) throw new NotFoundException('Emplacement destination introuvable.');
        const newWeight = destLoc.currentWeightKg + dto.weightKg;
        if (newWeight > destLoc.capacityKg) {
          throw new BadRequestException(
            `Capacité dépassée dans l'emplacement ${destLoc.code}. Capacité: ${destLoc.capacityKg} kg, Après mouvement: ${newWeight} kg`,
          );
        }
        await tx.storageLocation.update({
          where: { id: dto.destLocationId },
          data: {
            currentWeightKg: { increment: dto.weightKg },
            currentBags: { increment: dto.bagCount },
          },
        });
      }

      // Créer le mouvement
      const movement = await tx.detailedStockMovement.create({
        data: {
          type: dto.type as StockMovementType,
          weightKg: dto.weightKg,
          bagCount: dto.bagCount,
          sourceLocationId: dto.sourceLocationId || null,
          destLocationId: dto.destLocationId || null,
          storeId: dto.storeId,
          createdById: userId,
          referenceId: dto.referenceId || null,
        },
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          sourceLocation: { select: { code: true } },
          destLocation: { select: { code: true } },
        },
      });

      return movement;
    });
  }

  async findStockMovements(query: any) {
    const { storeId, type, startDate, endDate, page = 1, limit = 20 } = query;
    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      this.prisma.detailedStockMovement.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { date: 'desc' },
        include: {
          store: { select: { name: true, code: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          sourceLocation: { select: { code: true } },
          destLocation: { select: { code: true } },
        },
      }),
      this.prisma.detailedStockMovement.count({ where }),
    ]);

    return { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  // ─── INVENTAIRES ──────────────────────────────────────────────────────

  async createInventory(dto: CreateInventoryDto, userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
      include: {
        warehouses: {
          include: {
            storageZones: {
              include: { locations: true },
            },
          },
        },
      },
    });
    if (!store) throw new NotFoundException('Magasin introuvable.');

    // Générer le numéro d'inventaire
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').substring(0, 6);
    const count = await this.prisma.inventory.count({
      where: { inventoryNumber: { startsWith: `INV-${dateStr}` } },
    });
    const seq = (count + 1).toString().padStart(4, '0');
    const inventoryNumber = `INV-${dateStr}-${seq}`;

    // Créer l'inventaire avec les items pré-remplis (valeurs théoriques)
    const locations: any[] = [];
    store.warehouses.forEach((wh) => {
      wh.storageZones.forEach((zone) => {
        zone.locations.forEach((loc) => {
          locations.push({
            locationId: loc.id,
            theoreticalWeight: loc.currentWeightKg,
            theoreticalBags: loc.currentBags,
            physicalWeight: 0,
            physicalBags: 0,
            weightGap: -loc.currentWeightKg,
            bagsGap: -loc.currentBags,
          });
        });
      });
    });

    return this.prisma.inventory.create({
      data: {
        inventoryNumber,
        storeId: dto.storeId,
        createdById: userId,
        startDate: new Date(),
        items: {
          create: locations,
        },
      },
      include: {
        items: {
          include: {
            location: { select: { code: true, capacityKg: true } },
          },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findInventoryById(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        store: { select: { name: true, code: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        validatedBy: { select: { firstName: true, lastName: true } },
        items: {
          include: {
            location: { select: { code: true, capacityKg: true } },
          },
          orderBy: { location: { code: 'asc' } },
        },
      },
    });
    if (!inventory) throw new NotFoundException('Inventaire introuvable.');
    return inventory;
  }

  async submitInventoryItems(inventoryId: string, items: SubmitInventoryItemDto[]) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory) throw new NotFoundException('Inventaire introuvable.');
    if (inventory.status !== InventoryStatus.DRAFT && inventory.status !== InventoryStatus.COUNTING) {
      throw new BadRequestException("Cet inventaire n'est plus modifiable.");
    }

    // Mettre à jour chaque item
    for (const item of items) {
      const invItem = await this.prisma.inventoryItem.findFirst({
        where: { inventoryId, locationId: item.locationId },
      });
      if (!invItem) continue;

      await this.prisma.inventoryItem.update({
        where: { id: invItem.id },
        data: {
          physicalWeight: item.physicalWeight,
          physicalBags: item.physicalBags,
          weightGap: item.physicalWeight - invItem.theoreticalWeight,
          bagsGap: item.physicalBags - invItem.theoreticalBags,
        },
      });
    }

    // Passer le statut à COUNTING
    await this.prisma.inventory.update({
      where: { id: inventoryId },
      data: { status: InventoryStatus.COUNTING },
    });

    return this.findInventoryById(inventoryId);
  }

  async completeInventory(inventoryId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { items: true },
    });
    if (!inventory) throw new NotFoundException('Inventaire introuvable.');
    if (inventory.status !== InventoryStatus.COUNTING) {
      throw new BadRequestException("L'inventaire doit être en cours de comptage.");
    }

    return this.prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        status: InventoryStatus.PENDING_APPROVAL,
        endDate: new Date(),
      },
    });
  }

  async approveInventory(inventoryId: string, userId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { items: { include: { location: true } } },
    });
    if (!inventory) throw new NotFoundException('Inventaire introuvable.');
    if (inventory.status !== InventoryStatus.PENDING_APPROVAL) {
      throw new BadRequestException("L'inventaire n'est pas en attente d'approbation.");
    }

    // Appliquer les corrections de stock et créer les mouvements
    return this.prisma.$transaction(async (tx) => {
      for (const item of inventory.items) {
        if (item.weightGap !== 0 || item.bagsGap !== 0) {
          // Corriger le stock de l'emplacement
          await tx.storageLocation.update({
            where: { id: item.locationId },
            data: {
              currentWeightKg: item.physicalWeight,
              currentBags: item.physicalBags,
            },
          });

          // Créer un mouvement de correction
          const correctionWeight = item.physicalWeight - item.theoreticalWeight;
          await tx.detailedStockMovement.create({
            data: {
              type: 'INVENTORY_CORRECTION',
              weightKg: Math.abs(correctionWeight),
              bagCount: Math.abs(item.bagsGap),
              storeId: inventory.storeId,
              createdById: userId,
              referenceId: inventoryId,
              ...(correctionWeight > 0
                ? { destLocationId: item.locationId }
                : { sourceLocationId: item.locationId }),
            },
          });
        }
      }

      return tx.inventory.update({
        where: { id: inventoryId },
        data: {
          status: InventoryStatus.APPROVED,
          validatedById: userId,
        },
        include: {
          items: { include: { location: { select: { code: true } } } },
          store: { select: { name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          validatedBy: { select: { firstName: true, lastName: true } },
        },
      });
    });
  }

  async findAllInventories(query: any) {
    const { storeId, status, page = 1, limit = 20 } = query;
    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          store: { select: { name: true, code: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          validatedBy: { select: { firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  // ─── STATISTIQUES GLOBALES ────────────────────────────────────────────

  async getWarehouseStats() {
    const stores = await this.prisma.store.findMany({
      include: {
        warehouses: {
          include: {
            storageZones: {
              include: { locations: true },
            },
          },
        },
      },
    });

    let totalCapacityKg = 0;
    let totalCurrentKg = 0;
    let totalBags = 0;
    let totalLocations = 0;
    let totalWarehouses = 0;

    stores.forEach((store) => {
      totalCapacityKg += store.capacityKg;
      store.warehouses.forEach((wh) => {
        totalWarehouses++;
        wh.storageZones.forEach((zone) => {
          zone.locations.forEach((loc) => {
            totalCurrentKg += loc.currentWeightKg;
            totalBags += loc.currentBags;
            totalLocations++;
          });
        });
      });
    });

    const globalOccupancy = totalCapacityKg > 0
      ? Math.round((totalCurrentKg / totalCapacityKg) * 100 * 10) / 10
      : 0;

    // Mouvements du jour
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const movementsToday = await this.prisma.detailedStockMovement.count({
      where: { date: { gte: todayStart } },
    });

    // Inventaires en attente
    const pendingInventories = await this.prisma.inventory.count({
      where: { status: 'PENDING_APPROVAL' },
    });

    return {
      totalStores: stores.length,
      totalWarehouses,
      totalLocations,
      totalCapacityKg,
      totalCapacityTonnes: Math.round(totalCapacityKg / 10) / 100,
      totalCurrentKg: Math.round(totalCurrentKg * 100) / 100,
      totalCurrentTonnes: Math.round(totalCurrentKg / 10) / 100,
      totalBags,
      globalOccupancy,
      movementsToday,
      pendingInventories,
    };
  }
}
