import { IsEnum, IsNumber, Min } from 'class-validator';
import { BetSide } from '../entities/market-position.entity';

export class PlaceBetDto {
  @IsEnum(BetSide)
  side!: BetSide;

  @IsNumber()
  @Min(1)
  amount!: number;
}
