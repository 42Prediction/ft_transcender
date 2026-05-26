import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt'
import { User } from '../user/entities/user.entity';
import { CredentialsDto } from '../../shared/dto/Credentials.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { BettorService } from '../bettor/bettor.service';
import { Bettor } from '../bettor/entities/bettor.entity';

@Injectable()
export class AuthService{
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly bettorService: BettorService,
    ){}

    async googleLogin(user: any){
        if (!user){
            throw new Error('User not found');
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
        console.log(user.bettor);
        return {
            statusCode: 201,
            message: 'User created successfully.',
            data: {
                access_token: this.jwtService.sign(payload),
                id: user.id,
                email: user.email,
                role: user.role,
                nick: user.bettor.nick,
                avatar: user.bettor.avatar,
                isNickSetted: user.bettor.isNickSetted,
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

}