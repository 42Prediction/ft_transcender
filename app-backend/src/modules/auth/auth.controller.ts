import { Controller, Get, Res, Req, UseGuards, Post, Body } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CredentialsAuthDto } from './dto/credentials.auth.dto';


@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService, private configService: ConfigService) { }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
    }


    @Post('signin')
    async signin(@Body() signinDto: CredentialsAuthDto) {
        return await this.authService.signin(signinDto);
    }

    @Post('signup')
    async signup(@Body() signinAuthDto: CredentialsAuthDto) {
        return await this.authService.signup(signinAuthDto);
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
    
        const {access_token} = await this.authService._42SchoolLogin(req.query.code as string);
        const frontendUrl = this.configService.get('FRONTEND_URL');
        res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
    }

}
