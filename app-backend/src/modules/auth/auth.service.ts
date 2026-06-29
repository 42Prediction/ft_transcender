import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt'
import { User } from '../user/entities/user.entity';
import { CredentialsDto } from '../../shared/dto/Credentials.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { BettorService } from '../bettor/bettor.service';
import { Bettor } from '../bettor/entities/bettor.entity';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { Profile42Dto } from '../bettor/dto/profile-42.dto';

@Injectable()
export class AuthService{
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly bettorService: BettorService,
        private readonly configService: ConfigService,
    ){}

    async validateUser(email: string, password: string): Promise<User>{
        const user: User | null = await this.userService.findOneByEmail(email);
        if (!user){
            throw new UnauthorizedException('Invalid credentials');
        }
        if (!user.password){
            throw new UnauthorizedException({
                message: 'This account does not support password login. Use social login.',
            });
        }
        const isPasswordValid: boolean = await bcrypt.compare(password, user.password);
        if (!isPasswordValid){
            throw new UnauthorizedException('Invalid credentials');
        }
        return user;
    }

    async signin(siginDto: CredentialsDto): Promise<any>{
        const user = await this.validateUser(
            siginDto.email,
            siginDto.password,
        )

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        }
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            message: 'User login successfully.',
        }
    }

    async signup(signupDto: CreateUserDto): Promise<any>{
        const user: User = await this.userService.create(signupDto);
        const bettor: Bettor =  await this.bettorService.create(user);
        if (!bettor){
            throw new InternalServerErrorException('Bettor id required');
        }
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                nick: bettor.nick,
                avatar: bettor.avatar,
                isNickSetted: bettor.isNickSetted,
            },
            message: 'User created successfully.',
        }
    }

    async googleLogin(userGoogle: any){
        if (!userGoogle){
            throw new NotFoundException('User not found');
        }

        let user = await this.userService.findOneByEmail(userGoogle.email);

        if (user === null){
            user = await this.userService.createOauthUser({
                email: userGoogle.email,
            });
            await this.bettorService.create(user);
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token:this.jwtService.sign(payload),
            result:{
                id: user.id,
                email: user.email,
                role: user.role,
            }
        };
    }

    async _42SchoolLogin(code:string){

        if (!code)
            throw new BadRequestException("Missing code from 42 callback");

        const url = this.configService.getOrThrow('_42SCHOOL_API_URL_TOKEN');
        const body = new URLSearchParams({
            grant_type:'authorization_code',
            client_id:this.configService.getOrThrow('_42SCHOOL_CLIENT_ID'),
            client_secret:this.configService.getOrThrow('_42SCHOOL_CLIENT_SECRET'),
            code,
            redirect_uri:this.configService.getOrThrow<string>('_42SCHOOL_CALLBACK_URL'),
            state:'xyz'
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (!response.ok){
            const errorText = await response.text();
            throw new BadRequestException(
            `42 token error: ${response.status} ${errorText}`,
        );
        }

        const responseData = await response.json();
        const {email, campus} = await this.profileOauth42School(responseData.access_token);
        const {token} = await this.generateToken(email, {campus} as Profile42Dto);
        return {
            access_token: token,
        };
    }

    async profileOauth42School(token:string){
        const endpoint = this.configService.getOrThrow('_42SCHOOL_API_URL_OAUTH_PROFILE');
        const profileResponse = await fetch(endpoint,{
            method: 'GET',
            headers:{
                Authorization: 'Bearer '+token,
            }
        });

        if (!profileResponse.ok)
                throw new BadRequestException("Can't get user profile of API");

        const profileData = await profileResponse.json();
        return {name: profileData.login, email:profileData.email, campus: profileData.campus?.[0]?.name};
    }

    private async generateToken(email:string, profile42dto?: Profile42Dto){
        let user = await this.userService.findOneByEmail(email);

        if (user === null){
            user = await this.userService.createOauthUser({
                email: email,
            });
            const bettor = await this.bettorService.create(user, profile42dto);
            if (!bettor){
                throw new InternalServerErrorException('Bettor id required');
            }
        }


        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            token:this.jwtService.sign(payload),
            data:{}
        };
    }

    async verifyTempToken(token: string): Promise<User> {
        try {
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub;
            const user = await this.userService.findOne(userId);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            return user;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    async generateTempToken(user: User): Promise<string> {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.jwtService.sign(payload, { expiresIn: '5m' });
    }

    async login(user: User): Promise<{ access_token: string }> {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}