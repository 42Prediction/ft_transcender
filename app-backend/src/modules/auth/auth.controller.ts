import { Controller, Get, Post, Res, Req, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';


@Controller('auth')
export class AuthController{

constructor(private authService: AuthService, private configService:ConfigService){}

@Get('google')
@UseGuards(GoogleAuthGuard)
async googleAuth(){
}

@Get('school')
_42schoolAuth(@Res() res:Response){
   const url=this.configService.getOrThrow('_42SCHOOL_API_URL_AUTHORIRIZE');
   const params = new URLSearchParams({
    client_id:this.configService.getOrThrow<string>('_42SCHOOL_CLIENT_ID'),
    redirect_uri:this.configService.getOrThrow<string>('_42SCHOOL_CALLBACK_URL'),
    scope: 'public',
    response_type: 'code',
    state: 'xyz'
   });

   res.redirect(302, `${url}?${params.toString()}`);
}

@Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleAuthCallBack(@Req() req, @Res() res:Response){
    
    const { access_token } = await this.authService.googleLogin(req.user);
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
   
}

@Get('42luanda/callback')
async _42schoolAuthCallBack(@Req() req, @Res() res:Response){
   
   const {access_token} = await this.authService.accessToken42School(req.query.code as string);
   const { name, email } = await this.authService.profileOauth42School(access_token);
   res.send({ name, email });
    
}

@Get('profile')
@UseGuards(JwtAuthGuard)
getprofile(@Req() req){
    return req.user;
}

