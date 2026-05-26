import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AuthService{
constructor(
    private jwtService: JwtService, 
    private userService:UserService, 
    private readonly configService:ConfigService){}

async googleLogin(userGoogle: any){
    if (!userGoogle){
        throw new Error('Utilizador nao encontrado');
    }
    
    let user = await this.userService.findUser(userGoogle.email);

    if (user === null){
        user = await this.userService.createOauthUser({
            email: userGoogle.email,
            firstname: userGoogle.firstName,
            lastname: userGoogle.lastName,
        });
    }


    const payload = {
        email: user.email,
    };

    return {
        access_token:this.jwtService.sign(payload)
    };
}


async accessToken42School(code:string){

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
   return {access_token: responseData.access_token};
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

}