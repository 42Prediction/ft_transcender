import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService{
constructor(private jwtService: JwtService){}

async googleLogin(user: any){
    if (!user){
        throw new Error('Utilizador nao encontrado');
    }

    const payload = {
        email: user.email,
        sub: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    };

    return {
        message: 'Login efectuado com sucesso',
        user,
        access_token:this.jwtService.sign(payload)
    };
}

}