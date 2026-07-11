import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLotDto,
  CreateReservationDto,
  CreateStockMovementDto,
} from './dto/create-stock.dto';
import { LotStatus, ReservationStatus, CocoaQualityGrade, StockMovementType } from '@prisma/client';

@Injectable()
export class StocksService {
  constructor(private prisma: PrismaService) {}

  // ─── GESTION DES LOTS ──────────────────────────────────────────────────

  async createLot(dto: CreateLotDto) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id: dto.emplacementId },
    });
    if (!location) {
      throw new NotFoundException("Emplacement de stockage introuvable.");
    }

    // Génération automatique du numéro de lot si non fourni
    let numeroLot = dto.numeroLot;
    if (!numeroLot) {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').substring(0, 6); // YYYYMM
      const count = await this.prisma.lot.count({
        where: { numeroLot: { startsWith: `LOT-${dateStr}` } },
      });
      const seq = (count + 1).toString().padStart(4, '0');
      numeroLot = `LOT-${dateStr}-${seq}`;
    }

    // Valider la qualité
    const validGrades: CocoaQualityGrade[] = [
      CocoaQualityGrade.GRADE_1,
      CocoaQualityGrade.GRADE_2,
      CocoaQualityGrade.SOUS_GRADE,
    ];
    if (!validGrades.includes(dto.qualite as CocoaQualityGrade)) {
      throw new BadRequestException(`Qualité invalide: ${dto.qualite}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Vérifier la capacité de l'emplacement
      const newWeight = location.currentWeightKg + dto.poidsInitial;
      if (newWeight > location.capacityKg) {
        throw new BadRequestException(
          `Capacité dépassée dans l'emplacement ${location.code}. Capacité: ${location.capacityKg} kg, Après création: ${newWeight} kg`,
        );
      }

      // Mettre à jour le stock de l'emplacement
      await tx.storageLocation.update({
        where: { id: dto.emplacementId },
        data: {
          currentWeightKg: { increment: dto.poidsInitial },
          currentBags: { increment: dto.nombreSacs },
        },
      });

      // Créer le lot
      const lot = await tx.lot.create({
        data: {
          numeroLot,
          campagne: dto.campagne,
          qualite: dto.qualite as CocoaQualityGrade,
          poidsInitial: dto.poidsInitial,
          poidsActuel: dto.poidsInitial,
          nombreSacs: dto.nombreSacs,
          valeurAchat: dto.valeurAchat,
          valeurActuelle: dto.valeurAchat,
          emplacementId: dto.emplacementId,
          origineId: dto.origineId || null,
          status: LotStatus.DISPONIBLE,
        },
        include: {
          emplacement: { select: { code: true } },
        },
      });

      return lot;
    });
  }

  async findAllLots(query: any) {
    const { campagne, qualite, status, storeId, search, page = 1, limit = 20 } = query;
    const where: any = {};

    if (campagne) where.campagne = campagne;
    if (qualite) where.qualite = qualite as CocoaQualityGrade;
    if (status) where.status = status as LotStatus;
    if (storeId) {
      where.emplacement = {
        zone: {
          warehouse: {
            storeId: storeId,
          },
        },
      };
    }
    if (search) {
      where.numeroLot = { contains: search, mode: 'insensitive' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      this.prisma.lot.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          emplacement: {
            include: {
              zone: {
                include: {
                  warehouse: {
                    include: {
                      store: { select: { name: true, code: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.lot.count({ where }),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findLotById(id: string) {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      include: {
        emplacement: {
          include: {
            zone: {
              include: {
                warehouse: {
                  include: {
                    store: { select: { name: true, code: true } },
                  },
                },
              },
            },
          },
        },
        mouvements: {
          orderBy: { date: 'desc' },
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
            sourceLocation: { select: { code: true } },
            destLocation: { select: { code: true } },
          },
        },
        reservations: {
          orderBy: { createdAt: 'desc' },
          include: {
            utilisateur: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!lot) throw new NotFoundException("Lot introuvable.");
    return lot;
  }

  // ─── RÉSERVATIONS ──────────────────────────────────────────────────────

  async reserveLot(dto: CreateReservationDto, userId: string) {
    const lot = await this.prisma.lot.findUnique({ where: { id: dto.lotId } });
    if (!lot) throw new NotFoundException("Lot introuvable.");

    if (lot.status !== LotStatus.DISPONIBLE) {
      throw new BadRequestException(`Ce lot ne peut pas être réservé car son statut est : ${lot.status}`);
    }

    if (lot.poidsActuel < dto.quantite) {
      throw new BadRequestException(
        `Quantité insuffisante pour la réservation. Disponible: ${lot.poidsActuel} kg, Demandé: ${dto.quantite} kg`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Mettre à jour le statut du lot
      await tx.lot.update({
        where: { id: dto.lotId },
        data: { status: LotStatus.RESERVE },
      });

      // Créer l'enregistrement de réservation
      const reservation = await tx.reservation.create({
        data: {
          lotId: dto.lotId,
          quantite: dto.quantite,
          motif: dto.motif,
          statut: ReservationStatus.ACTIVE,
          utilisateurId: userId,
        },
        include: {
          lot: { select: { numeroLot: true } },
          utilisateur: { select: { firstName: true, lastName: true } },
        },
      });

      return reservation;
    });
  }

  async cancelReservation(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) throw new NotFoundException("Réservation introuvable.");

    if (reservation.statut !== ReservationStatus.ACTIVE) {
      throw new BadRequestException("Cette réservation n'est plus active.");
    }

    return this.prisma.$transaction(async (tx) => {
      // Remettre le lot en DISPONIBLE
      await tx.lot.update({
        where: { id: reservation.lotId },
        data: { status: LotStatus.DISPONIBLE },
      });

      // Annuler la réservation
      return tx.reservation.update({
        where: { id },
        data: { statut: ReservationStatus.ANNULEE },
        include: {
          lot: { select: { numeroLot: true } },
        },
      });
    });
  }

  // ─── MOUVEMENTS DE STOCK ──────────────────────────────────────────────

  async createMovement(dto: CreateStockMovementDto, userId: string) {
    const lot = await this.prisma.lot.findUnique({
      where: { id: dto.lotId },
      include: { emplacement: true },
    });
    if (!lot) throw new NotFoundException("Lot introuvable.");

    // Valider le type
    if (!['ENTREE', 'SORTIE', 'TRANSFERT'].includes(dto.type)) {
      throw new BadRequestException(`Type de mouvement invalide: ${dto.type}`);
    }

    // Résoudre le storeId global à partir de l'emplacement du lot
    const store = await this.prisma.storageLocation.findUnique({
      where: { id: lot.emplacementId },
      include: { zone: { include: { warehouse: true } } },
    });
    const storeId = store.zone.warehouse.storeId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Sortie de stock physique
      if (dto.type === 'SORTIE' || dto.type === 'TRANSFERT') {
        const sourceLocId = dto.emplacementOrigineId || lot.emplacementId;

        if (lot.poidsActuel < dto.quantite) {
          throw new BadRequestException("Stock disponible insuffisant sur ce lot.");
        }

        // Mettre à jour l'emplacement d'origine
        await tx.storageLocation.update({
          where: { id: sourceLocId },
          data: {
            currentWeightKg: { decrement: dto.quantite },
            currentBags: { decrement: dto.nombreSacs },
          },
        });

        // Mettre à jour le lot
        await tx.lot.update({
          where: { id: dto.lotId },
          data: {
            poidsActuel: { decrement: dto.quantite },
            nombreSacs: { decrement: dto.nombreSacs },
            status: lot.poidsActuel - dto.quantite <= 0 ? LotStatus.EXPEDIE : lot.status,
          },
        });
      }

      // 2. Entrée de stock physique
      if (dto.type === 'ENTREE' || dto.type === 'TRANSFERT') {
        const destLocId = dto.emplacementDestId;
        if (!destLocId) {
          throw new BadRequestException("Emplacement de destination obligatoire pour ce type de mouvement.");
        }

        const destLoc = await tx.storageLocation.findUnique({ where: { id: destLocId } });
        if (!destLoc) throw new NotFoundException("Emplacement de destination introuvable.");

        if (destLoc.currentWeightKg + dto.quantite > destLoc.capacityKg) {
          throw new BadRequestException("Capacité de l'emplacement de destination dépassée.");
        }

        // Mettre à jour l'emplacement de destination
        await tx.storageLocation.update({
          where: { id: destLocId },
          data: {
            currentWeightKg: { increment: dto.quantite },
            currentBags: { increment: dto.nombreSacs },
          },
        });

        if (dto.type === 'TRANSFERT') {
          // Déplacer le lot vers sa nouvelle destination
          await tx.lot.update({
            where: { id: dto.lotId },
            data: { emplacementId: destLocId },
          });
        } else {
          // Entrée simple : incrémenter le poids du lot
          await tx.lot.update({
            where: { id: dto.lotId },
            data: {
              poidsActuel: { increment: dto.quantite },
              nombreSacs: { increment: dto.nombreSacs },
            },
          });
        }
      }

      // Générer le numéro de mouvement
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const mvtCount = await tx.detailedStockMovement.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      });
      const seq = (mvtCount + 1).toString().padStart(4, '0');
      const numeroMouvement = `MVT-${dateStr}-${seq}`;

      // Convertir le type pour DetailedStockMovementType de Prisma
      let movementType: StockMovementType = StockMovementType.INTERNAL_TRANSFER;
      if (dto.type === 'ENTREE') {
        movementType = StockMovementType.IN_PURCHASE;
      } else if (dto.type === 'SORTIE') {
        movementType = StockMovementType.OUT_SALE;
      }

      // Enregistrer le DetailedStockMovement
      const movement = await tx.detailedStockMovement.create({
        data: {
          type: movementType,
          weightKg: dto.quantite,
          bagCount: dto.nombreSacs,
          sourceLocationId: dto.type === 'ENTREE' ? null : (dto.emplacementOrigineId || lot.emplacementId),
          destLocationId: dto.type === 'SORTIE' ? null : dto.emplacementDestId,
          lotId: dto.lotId,
          storeId,
          createdById: userId,
          date: new Date(),
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

  // ─── STATISTIQUES GLOBAL VALORISATION ────────────────────────────────

  async getStats() {
    const lots = await this.prisma.lot.findMany({
      include: {
        emplacement: {
          include: {
            zone: {
              include: {
                warehouse: {
                  include: {
                    store: { select: { name: true, id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalWeightKg = 0;
    let totalBags = 0;
    let totalValueFCFA = 0;
    const statsByStore: Record<string, { name: string; weight: number; value: number }> = {};
    const statsByQuality: Record<string, { weight: number; value: number }> = {};
    const statsByCampaign: Record<string, { weight: number; value: number }> = {};

    lots.forEach((lot) => {
      if (lot.status !== LotStatus.EXPEDIE) {
        totalWeightKg += lot.poidsActuel;
        totalBags += lot.nombreSacs;
        totalValueFCFA += lot.valeurActuelle * (lot.poidsActuel / (lot.poidsInitial || 1));

        // Par magasin
        const store = lot.emplacement.zone.warehouse.store;
        if (!statsByStore[store.id]) {
          statsByStore[store.id] = { name: store.name, weight: 0, value: 0 };
        }
        statsByStore[store.id].weight += lot.poidsActuel;
        statsByStore[store.id].value += lot.valeurActuelle * (lot.poidsActuel / (lot.poidsInitial || 1));

        // Par qualité
        const quality = lot.qualite;
        if (!statsByQuality[quality]) {
          statsByQuality[quality] = { weight: 0, value: 0 };
        }
        statsByQuality[quality].weight += lot.poidsActuel;
        statsByQuality[quality].value += lot.valeurActuelle * (lot.poidsActuel / (lot.poidsInitial || 1));

        // Par campagne
        const campaign = lot.campagne;
        if (!statsByCampaign[campaign]) {
          statsByCampaign[campaign] = { weight: 0, value: 0 };
        }
        statsByCampaign[campaign].weight += lot.poidsActuel;
        statsByCampaign[campaign].value += lot.valeurActuelle * (lot.poidsActuel / (lot.poidsInitial || 1));
      }
    });

    // Alertes automatiques
    const alerts = [];
    const minWeightThreshold = 5000; // 5 tonnes seuil global par défaut

    // Vérification des seuils par magasin
    Object.keys(statsByStore).forEach((storeId) => {
      const storeData = statsByStore[storeId];
      if (storeData.weight < minWeightThreshold) {
        alerts.push({
          type: 'LOW_STOCK',
          severity: 'WARNING',
          message: `Le stock théorique du magasin "${storeData.name}" est très bas (${Math.round(storeData.weight / 10) / 100} T).`,
          storeId,
        });
      }
    });

    // Lots bloqués
    lots.forEach((lot) => {
      if (lot.status === LotStatus.BLOQUE) {
        alerts.push({
          type: 'BLOCKED_LOT',
          severity: 'CRITICAL',
          message: `Le lot "${lot.numeroLot}" est bloqué (qualité non conforme ou suspecte).`,
          storeId: lot.emplacement.zone.warehouse.store.id,
        });
      }
    });

    return {
      totalLots: lots.filter(l => l.status !== LotStatus.EXPEDIE).length,
      totalWeightKg,
      totalWeightTonnes: Math.round(totalWeightKg / 10) / 100,
      totalBags,
      totalValueFCFA,
      cumpFCFA: totalWeightKg > 0 ? Math.round(totalValueFCFA / totalWeightKg) : 0,
      statsByStore: Object.values(statsByStore),
      statsByQuality,
      statsByCampaign,
      alerts,
    };
  }
}
