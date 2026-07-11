import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { PlantersService } from './planters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/planters')
@UseGuards(JwtAuthGuard)
export class PlantersController {
  constructor(private plantersService: PlantersService) {}

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.plantersService.create(body, req.user.id);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.plantersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.plantersService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.plantersService.update(id, body, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.plantersService.remove(id, req.user.id);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.plantersService.getHistory(id);
  }

  @Post(':id/credits')
  async grantCredit(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.plantersService.grantCredit(id, body, req.user.id);
  }

  @Post(':id/repayments')
  async recordRepayment(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.plantersService.recordRepayment(id, body, req.user.id);
  }

  @Post(':id/documents')
  async uploadDocument(@Param('id') id: string, @Body() body: any) {
    return this.plantersService.uploadDocument(id, body);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.plantersService.getStats(id);
  }
}
