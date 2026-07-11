import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PlantersModule } from './planters/planters.module';
import { SubBuyersModule } from './sub-buyers/sub-buyers.module';
import { ZoneManagersModule } from './zone-managers/zone-managers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    PlantersModule,
    SubBuyersModule,
    ZoneManagersModule,
  ],
})
export class AppModule {}
