import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CredentialsAuthDto } from './dto/credentials.auth.dto';
import { errorResponse, successResponse } from '../../shared/helper/api-response.helper';



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
        try {
            
        } catch (error) {
            return errorResponse(error);
        }
    }

    @Post('signin')
    @HttpCode(HttpStatus.OK)
    async signin(@Body() signinDto: CredentialsAuthDto, @Res({ passthrough: true }) res: Response) {
        try {
            const { access_token, ...result } = await this.authService.signin(signinDto);
            this.setAuthCookie(res, access_token);
            return successResponse<any>(HttpStatus.OK, result);
        } catch (error) {
            return errorResponse(error);
        }
    }

    @Post('signup')
    @HttpCode(HttpStatus.OK)
    async signup(@Body() signinAuthDto: CredentialsAuthDto) {
        try {
            const res = await this.authService.signup(signinAuthDto);
            return successResponse<any>(HttpStatus.CREATED, res);
        } catch (error) {
            return errorResponse(error);
        }
    }

    @Post('signout')
    @HttpCode(HttpStatus.OK)
    async signout(@Res({ passthrough: true }) res: Response) {
        try {
            res.clearCookie('access_token', { path: '/' });
            successResponse<any>(HttpStatus.OK, { message: 'Logged out' });
        } catch (error) {
            return errorResponse(error);
        }
    }

    @Get('school')
    _42schoolAuth(@Res() res: Response) {
        try {
            const url = this.configService.getOrThrow('_42SCHOOL_API_URL_AUTHORIRIZE');
            const params = new URLSearchParams({
                client_id: this.configService.getOrThrow<string>('_42SCHOOL_CLIENT_ID'),
                redirect_uri: this.configService.getOrThrow<string>('_42SCHOOL_CALLBACK_URL'),
                scope: 'public',
                response_type: 'code',
                state: 'xyz'
            });
    
            res.redirect(302, `${url}?${params.toString()}`);
        } catch (error) {
            return console.error(error);
        }
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallBack(@Req() req, @Res() res: Response) {
        try {
            const { access_token } = await this.authService.googleLogin(req.user);
            this.setAuthCookie(res, access_token);
            const frontendUrl = this.configService.get('FRONTEND_URL') as string;
            res.redirect(`${frontendUrl}`);
        } catch (error) {
            return errorResponse(error);
        }

    }

    @Get('42luanda/callback')
    async _42schoolAuthCallBack(@Req() req, @Res() res: Response) {
        try {
            const { access_token } = await this.authService._42SchoolLogin(req.query.code as string);
            this.setAuthCookie(res, access_token);
            const frontendUrl = this.configService.get('FRONTEND_URL');
            res.redirect(`${frontendUrl}`);
        } catch (error) {
            return errorResponse(error);
        }
    }
}
