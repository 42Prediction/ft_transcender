import { IsString } from "class-validator";
import { IsOptional } from "class-validator/types/decorator/common/IsOptional";

export class Profile42Dto {
    @IsOptional()
    @IsString()
    campus?: string;
}