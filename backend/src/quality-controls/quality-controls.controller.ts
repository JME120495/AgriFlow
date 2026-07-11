import { Controller, Get, Post, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { QualityControlsService } from './quality-controls.service';
import { CreateQualityControlDto } from './dto/create-quality-control.dto';
import { UpdateRuleDto } from './dto/update-rules.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/quality-controls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityControlsController {
  constructor(private readonly qualityControlsService: QualityControlsService) {}

  @Post()
  @Roles('ADMIN', 'MAGASINIER', 'RESPONSABLE_QUALITE')
  async create(@Body() dto: CreateQualityControlDto, @Req() req: any) {
    return this.qualityControlsService.create(dto, req.user.id);
  }

  @Get()
  async findAll() {
    return this.qualityControlsService.findAll();
  }

  @Get('rules')
  async getRules() {
    return this.qualityControlsService.getRules();
  }

  @Put('rules')
  @Roles('ADMIN', 'DIRECTEUR', 'RESPONSABLE_QUALITE')
  async updateRule(@Body() dto: UpdateRuleDto) {
    return this.qualityControlsService.updateRule(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.qualityControlsService.findOne(id);
  }

  @Post(':id/validate')
  @Roles('ADMIN', 'DIRECTEUR', 'RESPONSABLE_QUALITE')
  async validate(
    @Param('id') id: string,
    @Body('comment') comment: string,
    @Req() req: any
  ) {
    return this.qualityControlsService.validate(id, req.user.id, comment);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'DIRECTEUR', 'RESPONSABLE_QUALITE')
  async reject(
    @Param('id') id: string,
    @Body('comment') comment: string,
    @Req() req: any
  ) {
    return this.qualityControlsService.reject(id, req.user.id, comment);
  }
}
