import { IsEmail } from "class-validator";

export class CreateOauthUserDto{
    @IsEmail({}, {
        message: 'Invalid email address.',
    })
    email!:string;
}