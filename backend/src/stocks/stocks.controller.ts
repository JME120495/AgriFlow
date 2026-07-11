import {
  Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import {
  CreateLotDto,
  CreateReservationDto,
  CreateStockMovementDto,
} from './dto/create-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/stocks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  // ─── GESTION DES LOTS ──────────────────────────────────────────────────

  @Post('lots')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async createLot(@Body() dto: CreateLotDto) {
    return this.stocksService.createLot(dto);
  }

  @Get('lots')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR', 'CHEF_DE_ZONE')
  async findAllLots(@Query() query: any) {
    return this.stocksService.findAllLots(query);
  }

  @Get('lots/:id')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR', 'CHEF_DE_ZONE')
  async findLotById(@Param('id') id: string) {
    return this.stocksService.findLotById(id);
  }

  // ─── RÉSERVATIONS ──────────────────────────────────────────────────────

  @Post('reservations')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async reserveLot(@Body() dto: CreateReservationDto, @Req() req: any) {
    return this.stocksService.reserveLot(dto, req.user.id);
  }

  @Put('reservations/:id/cancel')
  @Roles('ADMIN', 'DIRECTEUR')
  async cancelReservation(@Param('id') id: string) {
    return this.stocksService.cancelReservation(id);
  }

  // ─── MOUVEMENTS DE STOCK ──────────────────────────────────────────────

  @Post('movements')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async createMovement(@Body() dto: CreateStockMovementDto, @Req() req: any) {
    return this.stocksService.createMovement(dto, req.user.id);
  }

  // ─── STATISTIQUES & VALORISATION ─────────────────────────────────────

  @Get('stats')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR')
  async getStats() {
    return this.stocksService.getStats();
  }
}
