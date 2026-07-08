import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BettorService } from './bettor.service';
import { BettorController } from './bettor.controller';
import { Bettor } from './entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { BettorFriendRequest } from './entities/friend.entity';
import { FriendService } from './friend.service';
import { AvatarService } from './avatar.service';
import { WalletModule } from '../wallet/wallet.module';
import { School42Module } from '../school42/school42.module';
import { BettorLevelSyncService } from './bettor-level-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bettor, User, BettorFriendRequest]), WalletModule, School42Module],
  controllers: [BettorController],
  providers: [BettorService, FriendService, AvatarService, BettorLevelSyncService],
  exports: [BettorService, FriendService],
})
export class BettorModule {}
