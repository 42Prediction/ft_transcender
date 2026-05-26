import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BettorService } from './bettor.service';
import { BettorController } from './bettor.controller';
import { Bettor } from './entities/bettor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bettor])],
  controllers: [BettorController],
  providers: [BettorService],
  exports: [BettorService],
})
export class BettorModule {}
