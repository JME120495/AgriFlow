import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpis')
  async getKpis(@Req() req: any, @Query() query: any) {
    return this.dashboardService.getKpis(req.user, query);
  }

  @Get('charts')
  async getCharts(@Req() req: any, @Query() query: any) {
    return this.dashboardService.getCharts(req.user, query);
  }

  @Get('alerts')
  async getAlerts(@Req() req: any) {
    return this.dashboardService.getAlerts(req.user);
  }

  @Get('activities')
  async getActivities(@Req() req: any) {
    return this.dashboardService.getActivities(req.user);
  }

  @Get('config')
  async getConfig(@Req() req: any) {
    return this.dashboardService.getConfig(req.user);
  }

  @Post('config')
  async saveConfig(@Req() req: any, @Body() body: any) {
    return this.dashboardService.saveConfig(req.user, body);
  }
}
