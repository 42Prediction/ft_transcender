import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum } from 'class-validator';
import { Role } from '../../../shared/enums/roles.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
