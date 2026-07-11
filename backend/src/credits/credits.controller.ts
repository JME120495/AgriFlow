import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { RepayCreditDto } from './dto/repay-credit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/credits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post()
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CAISSIER')
  async create(@Body() dto: CreateCreditDto, @Req() req: any) {
    return this.creditsService.create(dto, req.user.id);
  }

  @Post(':id/validate')
  @Roles('ADMIN', 'DIRECTEUR')
  async validate(@Param('id') id: string, @Req() req: any) {
    // req.user.role can be checked. We need to pass the role name to the service.
    // In our system, req.user.role is the role object or name. Let's find out how it is structured.
    // Usually it has a name like req.user.role?.name or req.user.roleName. Let's pass both.
    const roleName = req.user.role?.name || req.user.role || '';
    return this.creditsService.validate(id, req.user.id, roleName);
  }

  @Post(':id/repayments')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CAISSIER')
  async repay(@Param('id') id: string, @Body() dto: RepayCreditDto, @Req() req: any) {
    return this.creditsService.repay(id, dto, req.user.id);
  }

  @Get('stats')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'AUDITEUR')
  async getStats() {
    return this.creditsService.getStats();
  }

  @Get()
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'AUDITEUR', 'CHEF_DE_ZONE', 'CAISSIER')
  async findAll(@Query() query: any) {
    return this.creditsService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'AUDITEUR', 'CHEF_DE_ZONE', 'CAISSIER')
  async findOne(@Param('id') id: string) {
    return this.creditsService.findOne(id);
  }
}
