import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { MarketGateway } from './market.gateway';
import { ExamMarketSyncService } from './exam-market-sync.service';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Market } from './entities/market.entity';
import { MarketPosition } from './entities/market-position.entity';
import { Notification } from './entities/notification.entity';
import { Bettor } from '../bettor/entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { School42Module } from '../school42/school42.module';
import { BettorModule } from '../bettor/bettor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market, MarketPosition, Notification, Bettor, User]),
    ScheduleModule.forRoot(),
    // Secret-less registration: the gateway verifies socket-handshake JWTs
    // explicitly with the same JWT_SECRET the auth module signs with.
    JwtModule.register({}),
    WalletModule,
    School42Module,
    BettorModule,
  ],
  controllers: [MarketController, NotificationController],
  providers: [MarketService, MarketGateway, ExamMarketSyncService, NotificationService],
  exports: [MarketService],
})
export class MarketModule {}
