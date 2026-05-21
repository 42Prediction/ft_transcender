import { Controller, Get, Res,  Req, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AdvancedConsoleLogger } from 'typeorm';


@Controller('auth')
export class AuthController{

constructor(private authService: AuthService, private configService:ConfigService){}

@Get('google')
@UseGuards(GoogleAuthGuard)
async googleAuth(){
}

@Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleAuthCallBack(@Req() req, @Res() res:Response){
    
    const { access_token } = await this.authService.googleLogin(req.user);

    const frontendUrl = this.configService.get('FRONTEND_URL');

    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
}

@Get('profile')
@UseGuards(JwtAuthGuard)
getprofile(@Req() req){
    return req.user;
}

}

