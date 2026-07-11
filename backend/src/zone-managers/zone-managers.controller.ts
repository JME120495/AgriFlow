import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ZoneManagersService } from './zone-managers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/zone-managers')
@UseGuards(JwtAuthGuard)
export class ZoneManagersController {
  constructor(private zoneManagersService: ZoneManagersService) {}

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.zoneManagersService.create(body, req.user.id);
  }

  @Get()
  async findAll() {
    return this.zoneManagersService.findAll();
  }

  @Get('performance/leaderboard')
  async getLeaderboard(@Query() query: any) {
    return this.zoneManagersService.getLeaderboard(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.zoneManagersService.findOne(id);
  }

  @Post(':id/zones')
  async assignZone(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.zoneManagersService.assignZone(id, body, req.user.id);
  }

  @Delete(':id/zones/:zoneId')
  async removeZone(@Param('id') id: string, @Param('zoneId') zoneId: string, @Req() req: any) {
    return this.zoneManagersService.removeZone(id, zoneId, req.user.id);
  }

  @Post(':id/sub-buyers')
  async attachSubBuyer(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.zoneManagersService.attachSubBuyer(id, body, req.user.id);
  }

  @Post(':id/objectives')
  async defineObjective(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.zoneManagersService.defineObjective(id, body, req.user.id);
  }

  @Get(':id/objectives')
  async getObjectives(@Param('id') id: string) {
    return this.zoneManagersService.getObjectives(id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.zoneManagersService.getStats(id);
  }

  @Post('visits')
  async recordVisit(@Body() body: any, @Req() req: any) {
    return this.zoneManagersService.recordVisit(body, req.user.id);
  }
}
