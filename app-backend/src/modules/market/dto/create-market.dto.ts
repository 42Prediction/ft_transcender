import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MarketCategory } from '../entities/market.entity';

export class CreateMarketDto {
  @IsString()
  subjectLogin!: string;

  @IsString()
  subjectName!: string;

  @IsOptional()
  @IsString()
  subjectAvatar?: string;

  @IsString()
  @MinLength(4)
  project!: string;

  @IsEnum(MarketCategory)
  category!: MarketCategory;

  @IsDateString()
  closesAt!: string;
}
