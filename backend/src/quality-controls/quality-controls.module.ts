import { Module } from '@nestjs/common';
import { QualityControlsController } from './quality-controls.controller';
import { QualityControlsService } from './quality-controls.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QualityControlsController],
  providers: [QualityControlsService],
  exports: [QualityControlsService],
})
export class QualityControlsModule {}
