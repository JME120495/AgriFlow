import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ZoneManagersService } from './zone-managers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/zone-managers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoneManagersController {
  constructor(private zoneManagersService: ZoneManagersService) {}

  @Post()
  @Roles('ADMIN', 'DIRECTEUR')
  async create(@Body() body: any, @Req() req: any) {
    return this.zoneManagersService.create(body, req.user.id);
  }

  @Get()
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'AUDITEUR')
  async findAll() {
    return this.zoneManagersService.findAll();
  }

  @Get('performance/leaderboard')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CHEF_DE_ZONE')
  async getLeaderboard(@Query() query: any) {
    return this.zoneManagersService.getLeaderboard(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CHEF_DE_ZONE', 'AUDITEUR')
  async findOne(@Param('id') id: string) {
    return this.zoneManagersService.findOne(id);
  }

  @Post(':id/zones')
  @Roles('ADMIN', 'DIRECTEUR')
  async assignZone(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.zoneManagersService.assignZone(id, body, req.user.id);
  }

  @Delete(':id/zones/:zoneId')
  @Roles('ADMIN', 'DIRECTEUR')
  async removeZone(@Param('id') id: string, @Param('zoneId') zoneId: string, @Req() req: any) {
    return this.zoneManagersService.removeZone(id, zoneId, req.user.id);
  }

  @Post(':id/sub-buyers')
  @Roles('ADMIN', 'DIRECTEUR', 'CHEF_DE_ZONE')
  async attachSubBuyer(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.zoneManagersService.attachSubBuyer(id, body, req.user.id);
  }

  @Post(':id/objectives')
  @Roles('ADMIN', 'DIRECTEUR', 'CHEF_DE_ZONE')
  async defineObjective(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.zoneManagersService.defineObjective(id, body, req.user.id);
  }

  @Get(':id/objectives')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CHEF_DE_ZONE')
  async getObjectives(@Param('id') id: string) {
    return this.zoneManagersService.getObjectives(id);
  }

  @Get(':id/stats')
  @Roles('ADMIN', 'DIRECTEUR', 'COMPTABLE', 'CHEF_DE_ZONE')
  async getStats(@Param('id') id: string) {
    return this.zoneManagersService.getStats(id);
  }

  @Post('visits')
  @Roles('CHEF_DE_ZONE')
  async recordVisit(@Body() body: any, @Req() req: any) {
    return this.zoneManagersService.recordVisit(body, req.user.id);
  }
}
