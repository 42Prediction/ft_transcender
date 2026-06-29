import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CredentialsAuthDto } from './dto/credentials.auth.dto';
import { User } from '../user/entities/user.entity';
import { TwoFactorCodeDto } from './dto/two-factor-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TwoFactorService } from './two-factor.service';
import { UserService } from '../user/user.service';
import { UnauthorizedException } from '@nestjs/common';


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private configService: ConfigService,
                private twoFactorService: TwoFactorService, private userService: UserService
    ) { }

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

    private setTempTwoFactorCookie(res: Response, tempToken: string) {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        res.cookie('temp_2fa_token', tempToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 5 * 60 * 1000, // 5 minutos
            path: '/',
        });
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth(@Req() req) {
    }

    @Post('signin')
    async signin(@Body() signinDto: CredentialsAuthDto, @Res({ passthrough: true }) res: Response) {
        const { access_token, user, ...result } = await this.authService.signin(signinDto);

        if (user.isTwoFactorEnabled) {
            const tempToken = await this.authService.generateTempToken(user);
            this.setTempTwoFactorCookie(res, tempToken);
            return { message: '2FA required' };
        }
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
        res.redirect(`${frontendUrl}/auth/callback`);
    }

    //----------- 2FA Endpoints -----------//

    @UseGuards(JwtAuthGuard)
    @Post('2fa/generate')
    async generate2FA(@Req() req) {
        const secret = this.twoFactorService.generateSecret();
        await this.userService.setTwoFactorSecret(req.user.id, secret);

        const otpAuthUrl = this.twoFactorService.generateOtpAuthUrl(req.user.email, secret);
        const qrCode = await this.twoFactorService.generateQrCodeDataUrl(otpAuthUrl);

        return { qrCode };
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/turn-on')
    async turnOn2FA(@Req() req, @Body() dto: TwoFactorCodeDto) {
        const user = await this.userService.findOne(req.user.id);
        const isValid = await this.twoFactorService.verifyToken(dto.code, user.twoFactorSecret);

        if (!isValid) {
            throw new UnauthorizedException('Código inválido');
        }

        await this.userService.enableTwoFactor(req.user.id);
        return { message: '2FA ativado com sucesso' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/turn-off')
    async turnOff2FA(@Req() req) {
        await this.userService.disableTwoFactor(req.user.id);
        return { message: '2FA desativado' };
    }

    @Post('2fa/authenticate')
    async authenticate2FA(@Req() req, @Body() dto: TwoFactorCodeDto, @Res({ passthrough: true }) res: Response) {
        const tempToken = req.cookies?.temp_2fa_token;
        if (!tempToken) {
            throw new UnauthorizedException('Sessão de 2FA expirada ou inexistente');
        }

        const payload = await this.authService.verifyTempToken(tempToken);
        const user = await this.userService.findOne(payload.id);

        const isValid = this.twoFactorService.verifyToken(dto.code, user.twoFactorSecret);
        if (!isValid) {
            throw new UnauthorizedException('Código 2FA inválido');
        }

        const { access_token } = await this.authService.login(user);
        res.clearCookie('temp_2fa_token', { path: '/' });
        this.setAuthCookie(res, access_token);

        return { message: 'Autenticado com sucesso' };
    }
}
