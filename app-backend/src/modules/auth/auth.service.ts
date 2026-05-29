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
            statusCode: 201,
            message: 'User created successfully.',
            data: {
                access_token: this.jwtService.sign(payload),
                id: user.id,
                email: user.email,
                role: user.role,
            }
        }
    }

    async signup(signupDto: CreateUserDto): Promise<any>{
        const user: User = await this.userService.create(signupDto);
        const bettor: Bettor =  await this.bettorService.create(user);
        if (!bettor){
            throw new InternalServerErrorException('Bettor id required');
        }
        return {
            statusCode: 201,
            message: 'User created successfully.',
            data: {
                id: user.id,
                email: user.email,
                role: user.role,
                nick: bettor.nick,
                avatar: bettor.avatar,
                isNickSetted: bettor.isNickSetted,
            }
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
            this.bettorService.create(user);
        }


        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token:this.jwtService.sign(payload)
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
    const {email} = await this.profileOauth42School(responseData.access_token);
    const {token} = await this.generateToken(email);
    return {access_token: token};
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

    return {name: profileData.login, email:profileData.email};
    }

    async generateToken(email:string){
        let user = await this.userService.findOneByEmail(email);

        if (user === null){
            user = await this.userService.createOauthUser({
                email: email,
            });
            this.bettorService.create(user);
        }


        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            token:this.jwtService.sign(payload)
        };
    }
}