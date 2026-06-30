import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { Market } from './entities/market.entity';
import { MarketPosition } from './entities/market-position.entity';
import { Bettor } from '../bettor/entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { School42Module } from '../school42/school42.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market, MarketPosition, Bettor, User]),
    WalletModule,
    School42Module,
  ],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
