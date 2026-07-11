import {
  Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import {
  CreateWarehouseDto,
  CreateStorageZoneDto,
  CreateStorageLocationDto,
  CreateStockMovementDto,
  CreateInventoryDto,
  SubmitInventoryItemDto,
} from './dto/create-warehouse.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  // ─── MAGASINS ─────────────────────────────────────────────────────────

  @Get('stores')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR')
  async findAllStores(@Query() query: any) {
    return this.warehousesService.findAllStores(query);
  }

  @Get('stores/:id')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR')
  async findStoreById(@Param('id') id: string) {
    return this.warehousesService.findStoreById(id);
  }

  @Get('stats')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR')
  async getStats() {
    return this.warehousesService.getWarehouseStats();
  }

  // ─── ENTREPÔTS ────────────────────────────────────────────────────────

  @Post('warehouse')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.createWarehouse(dto);
  }

  // ─── ZONES ────────────────────────────────────────────────────────────

  @Post('zone')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async createStorageZone(@Body() dto: CreateStorageZoneDto) {
    return this.warehousesService.createStorageZone(dto);
  }

  // ─── EMPLACEMENTS ────────────────────────────────────────────────────

  @Post('location')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async createStorageLocation(@Body() dto: CreateStorageLocationDto) {
    return this.warehousesService.createStorageLocation(dto);
  }

  // ─── MOUVEMENTS DE STOCK ──────────────────────────────────────────────

  @Post('movements')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async createStockMovement(@Body() dto: CreateStockMovementDto, @Req() req: any) {
    return this.warehousesService.createStockMovement(dto, req.user.id);
  }

  @Get('movements')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR')
  async findStockMovements(@Query() query: any) {
    return this.warehousesService.findStockMovements(query);
  }

  // ─── INVENTAIRES ──────────────────────────────────────────────────────

  @Post('inventories')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async createInventory(@Body() dto: CreateInventoryDto, @Req() req: any) {
    return this.warehousesService.createInventory(dto, req.user.id);
  }

  @Get('inventories')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR')
  async findAllInventories(@Query() query: any) {
    return this.warehousesService.findAllInventories(query);
  }

  @Get('inventories/:id')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER', 'AUDITEUR')
  async findInventoryById(@Param('id') id: string) {
    return this.warehousesService.findInventoryById(id);
  }

  @Put('inventories/:id/items')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async submitInventoryItems(
    @Param('id') id: string,
    @Body() body: { items: SubmitInventoryItemDto[] },
  ) {
    return this.warehousesService.submitInventoryItems(id, body.items);
  }

  @Post('inventories/:id/complete')
  @Roles('ADMIN', 'DIRECTEUR', 'MAGASINIER')
  async completeInventory(@Param('id') id: string) {
    return this.warehousesService.completeInventory(id);
  }

  @Post('inventories/:id/approve')
  @Roles('ADMIN', 'DIRECTEUR')
  async approveInventory(@Param('id') id: string, @Req() req: any) {
    return this.warehousesService.approveInventory(id, req.user.id);
  }
}
