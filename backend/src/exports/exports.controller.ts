import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('planters/csv')
  @Roles('ADMIN', 'DIRECTEUR')
  async exportPlantersCsv(@Res() res: Response) {
    const csv = await this.exportsService.exportPlantersToCsv();
    res.header('Content-Type', 'text/csv');
    res.attachment('planters.csv');
    return res.send(csv);
  }

  @Get('sub-buyers/csv')
  @Roles('ADMIN', 'DIRECTEUR')
  async exportSubBuyersCsv(@Res() res: Response) {
    const csv = await this.exportsService.exportSubBuyersToCsv();
    res.header('Content-Type', 'text/csv');
    res.attachment('sub-buyers.csv');
    return res.send(csv);
  }
}
