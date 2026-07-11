import { Module } from '@nestjs/common';
import { SubBuyersController } from './sub-buyers.controller';
import { SubBuyersService } from './sub-buyers.service';

@Module({
  controllers: [SubBuyersController],
  providers: [SubBuyersService],
  exports: [SubBuyersService],
})
export class SubBuyersModule {}
