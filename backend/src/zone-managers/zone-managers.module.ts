import { Module } from '@nestjs/common';
import { ZoneManagersController } from './zone-managers.controller';
import { ZoneManagersService } from './zone-managers.service';

@Module({
  controllers: [ZoneManagersController],
  providers: [ZoneManagersService],
  exports: [ZoneManagersService],
})
export class ZoneManagersModule {}
