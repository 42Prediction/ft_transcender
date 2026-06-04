import { PartialType } from '@nestjs/mapped-types';
import { CreateBettorDto } from './create-bettor.dto';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBettorDto extends PartialType(CreateBettorDto) {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(16)
  nick?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bio?: string;
}
