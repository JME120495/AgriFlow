import { Module } from '@nestjs/common';
import { PlantersController } from './planters.controller';
import { PlantersService } from './planters.service';

@Module({
  controllers: [PlantersController],
  providers: [PlantersService],
  exports: [PlantersService],
})
export class PlantersModule {}
