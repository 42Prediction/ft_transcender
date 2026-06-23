import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CredentialsAuthDto } from './dto/credentials.auth.dto';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private configService: ConfigService) { }

    private setAuthCookie(res: Response, accessToken: string) {
        const isProduction = this.configService.get('NODE_ENV') === 'production';

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth(@Req() req) {
    }

    @Post('signin')
    async signin(@Body() signinDto: CredentialsAuthDto, @Res({ passthrough: true }) res: Response) {
        const { access_token, ...result } = await this.authService.signin(signinDto);
        this.setAuthCookie(res, access_token);
        return result;
    }

    @Post('signup')
    async signup(@Body() signinAuthDto: CredentialsAuthDto) {
        return await this.authService.signup(signinAuthDto);
    }

    @Post('signout')
    async signout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token', { path: '/' });
        return { message: 'Logged out' };
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
        this.setAuthCookie(res, access_token);
        const frontendUrl = this.configService.get('FRONTEND_URL') as string;
        res.redirect(`${frontendUrl}`);

    }

    @Get('42luanda/callback')
    async _42schoolAuthCallBack(@Req() req, @Res() res:Response){

        const {access_token} = await this.authService._42SchoolLogin(req.query.code as string);
        this.setAuthCookie(res, access_token);
        const frontendUrl = this.configService.get('FRONTEND_URL');
        res.redirect(`${frontendUrl}`);
    }
}
