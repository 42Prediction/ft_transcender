import { PartialType } from '@nestjs/mapped-types';
import { CreateBettorDto } from './create-bettor.dto';

export class UpdateBettorDto extends PartialType(CreateBettorDto) {}
