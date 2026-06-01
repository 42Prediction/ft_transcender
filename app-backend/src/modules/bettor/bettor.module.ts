import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BettorService } from './bettor.service';
import { BettorController } from './bettor.controller';
import { Bettor } from './entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { AvatarService } from './avatar.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bettor, User])],
  controllers: [BettorController],
  providers: [BettorService, AvatarService],
  exports: [BettorService],
})
export class BettorModule {}
