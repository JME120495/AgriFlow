import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'MAGASINIER')
  async create(@Body() dto: CreatePurchaseDto, @Req() req: any) {
    return this.purchasesService.create(dto, req.user.id);
  }

  @Post(':id/pay')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE')
  async validatePayment(@Param('id') id: string, @Req() req: any) {
    return this.purchasesService.validatePayment(id, req.user.id);
  }

  @Get('stats')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'AUDITEUR')
  async getStats() {
    return this.purchasesService.getStats();
  }

  @Get()
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'AUDITEUR', 'CHEF_DE_ZONE')
  async findAll(@Query() query: any) {
    return this.purchasesService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'AUDITEUR', 'CHEF_DE_ZONE')
  async findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }
}
