import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PlantersModule } from './planters/planters.module';
import { SubBuyersModule } from './sub-buyers/sub-buyers.module';
import { ZoneManagersModule } from './zone-managers/zone-managers.module';
import { FilesModule } from './files/files.module';
import { ExportsModule } from './exports/exports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CreditsModule } from './credits/credits.module';
import { PurchasesModule } from './purchases/purchases.module';
import { QualityControlsModule } from './quality-controls/quality-controls.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { StocksModule } from './stocks/stocks.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    PlantersModule,
    SubBuyersModule,
    ZoneManagersModule,
    FilesModule,
    ExportsModule,
    NotificationsModule,
    CreditsModule,
    PurchasesModule,
    QualityControlsModule,
    WarehousesModule,
    StocksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
