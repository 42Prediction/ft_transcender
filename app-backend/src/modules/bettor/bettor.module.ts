import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BettorService } from './bettor.service';
import { BettorController } from './bettor.controller';
import { Bettor } from './entities/bettor.entity';
import { User } from '../user/entities/user.entity';
// 1. Importa a nova entidade aqui - Marco
import { BettorFriendRequest } from './entities/bettor-friend-request.entity';
import { FriendService } from './friend.service';
import { AvatarService } from './avatar.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bettor, User, BettorFriendRequest])],
  controllers: [BettorController],
  providers: [BettorService, FriendService, AvatarService],
  exports: [BettorService, FriendService],
})
export class BettorModule {}
