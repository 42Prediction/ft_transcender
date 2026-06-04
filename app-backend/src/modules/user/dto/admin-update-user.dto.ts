import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../../shared/enums/roles.enum';

export class AdmUpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
