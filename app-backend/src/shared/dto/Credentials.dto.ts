import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator'

export class CredentialsDto {
    @IsEmail({}, {
        message: 'Invalid email address.',
    })
    email!:      string;

    @IsString()
    @IsNotEmpty({
        message: 'Password cannot be empty.',
    })
    @MinLength(8, { 
        message: 'Password must be at least 8 characters long.'
    })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
    })
    password!:   string;
}