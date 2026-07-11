import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode } from '@nestjs/common';
import { SubBuyersService } from './sub-buyers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/sub-buyers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubBuyersController {
  constructor(private subBuyersService: SubBuyersService) {}

  // 1. Create Sub-buyer
  @Post()
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE')
  async create(@Body() body: any, @Req() req: any) {
    return this.subBuyersService.create(body, req.user.id);
  }

  // 2. List all sub-buyers
  @Get()
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CHEF_DE_ZONE', 'AUDITEUR')
  async findAll(@Query() query: any) {
    return this.subBuyersService.findAll(query);
  }

  // 3. Find one detailed sub-buyer
  @Get(':id')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CHEF_DE_ZONE', 'AUDITEUR', 'SOUS_ACHETEUR')
  async findOne(@Param('id') id: string, @Req() req: any) {
    // If the caller is a sub-buyer, make sure they only access their own profile
    if (req.user.role === 'SOUS_ACHETEUR' && req.user.id !== id) {
      throw new BadRequestException("Accès interdit : vous ne pouvez consulter que votre propre profil.");
    }
    return this.subBuyersService.findOne(id);
  }

  // 4. Update sub-buyer profile
  @Patch(':id')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.subBuyersService.update(id, body);
  }

  // 5. Suspend sub-buyer
  @Post(':id/suspend')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE')
  async suspend(@Param('id') id: string, @Body('reason') reason: string) {
    return this.subBuyersService.suspend(id, reason);
  }

  // 6. Grant advance
  @Post(':id/advances')
  @Roles('ADMIN', 'COMPTABLE')
  async grantAdvance(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.subBuyersService.grantAdvance(id, body, req.user.id);
  }

  // 7. Create brousse expense declaration
  @Post(':id/expenses')
  @Roles('SOUS_ACHETEUR')
  async createExpense(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.user.id !== id) {
      throw new BadRequestException("Accès interdit : vous ne pouvez enregistrer des dépenses que pour vous-même.");
    }
    return this.subBuyersService.createExpense(id, body);
  }

  // 8. Validate/Approve expense
  @Post('expenses/:expenseId/validate')
  @Roles('ADMIN', 'COMPTABLE')
  async validateExpense(
    @Param('expenseId') expenseId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Req() req: any
  ) {
    return this.subBuyersService.validateExpense(expenseId, status, req.user.id);
  }

  // 9. Record direct cash repayment
  @Post(':id/repayments')
  @Roles('ADMIN', 'COMPTABLE')
  async recordCashRepayment(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.subBuyersService.recordCashRepayment(id, body, req.user.id);
  }

  // 10. Sub-buyer declares delivery loading
  @Post(':id/deliveries')
  @Roles('SOUS_ACHETEUR')
  async declareDelivery(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (req.user.id !== id) {
      throw new BadRequestException("Accès interdit : vous ne pouvez déclarer des livraisons que pour vous-même.");
    }
    return this.subBuyersService.declareDelivery(id, body);
  }

  // 11. Magasinier weighs and validates delivery
  @Post('deliveries/:deliveryId/weigh')
  @Roles('ADMIN', 'MAGASINIER')
  async weighDelivery(@Param('deliveryId') deliveryId: string, @Body() body: any, @Req() req: any) {
    return this.subBuyersService.weighDelivery(deliveryId, body, req.user.id);
  }

  // 12. Get Portfolio ledger
  @Get(':id/ledger')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'SOUS_ACHETEUR')
  async getLedger(@Param('id') id: string, @Req() req: any) {
    if (req.user.role === 'SOUS_ACHETEUR' && req.user.id !== id) {
      throw new BadRequestException("Accès interdit : vous ne pouvez consulter que votre propre portefeuille.");
    }
    return this.subBuyersService.getLedger(id);
  }

  // 13. Get attached planters
  @Get(':id/planters')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CHEF_DE_ZONE', 'SOUS_ACHETEUR')
  async getAttachedPlanters(@Param('id') id: string, @Req() req: any) {
    if (req.user.role === 'SOUS_ACHETEUR' && req.user.id !== id) {
      throw new BadRequestException("Accès interdit : vous ne pouvez consulter que vos propres planteurs.");
    }
    return this.subBuyersService.getAttachedPlanters(id);
  }

  // 14. Get detailed aggregated metrics
  @Get(':id/stats')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CHEF_DE_ZONE', 'SOUS_ACHETEUR')
  async getStats(@Param('id') id: string, @Req() req: any) {
    if (req.user.role === 'SOUS_ACHETEUR' && req.user.id !== id) {
      throw new BadRequestException("Accès interdit : vous ne pouvez consulter que vos propres statistiques.");
    }
    return this.subBuyersService.getStats(id);
  }
}

// Exception definition wrapper for compilation if not imported
import { BadRequestException as NestBadRequestException } from '@nestjs/common';
const BadRequestException = NestBadRequestException;
