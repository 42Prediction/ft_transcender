import { Controller, Get, Body, Patch, Param, Query, Req, UseInterceptors, ClassSerializerInterceptor, UseGuards, UploadedFile, Post, Delete, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { BettorService } from './bettor.service';
import { FriendService } from './friend.service';
import { UpdateBettorDto } from './dto/update-bettor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarUploadConfig } from '../../config/multer.config';
import { ApiResponse, errorResponse, successResponse, unauthorizedResponse } from '../../shared/helper/api-response.helper';
import { Bettor } from './entities/bettor.entity';
import { BettorFriendRequest } from './entities/friend.entity';

@Controller('bettor')
@UseInterceptors(ClassSerializerInterceptor)
export class BettorController {
  constructor(
    private readonly bettorService: BettorService,
    private readonly friendService: FriendService
  ) {}

  @Get('me')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findMyProfile(@Req() req: any): Promise< ApiResponse<Bettor | null> > {
    if (!req.user?.id) return unauthorizedResponse();

    try {
      const bettor = await this.bettorService.findOne(req.user.id);
      return successResponse<Bettor>( HttpStatus.OK, bettor as Bettor);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', avatarUploadConfig))
  async updateProfile(
      @Req() req: any,
      @Body() updateBettorDto: UpdateBettorDto,
      @UploadedFile() avatarFile?: Express.Multer.File
  )
  {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const bettor = await this.bettorService.update(req.user.id, updateBettorDto, avatarFile);
      return successResponse<Bettor>(HttpStatus.OK, bettor); 
    } catch (error) {
      return errorResponse(error);
    }
    
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async searchBettors(@Req() req: any, @Query('q') q: string) {
    try {
      const data = await this.bettorService.searchByNick(q ?? '', 8, req.user?.id);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('@:nick/exists')
  @HttpCode(HttpStatus.OK)
  async checkNickExists(@Param('nick') nick: string): Promise<{ exists: boolean }> {
    const exists = await this.bettorService.nickExists(nick);
    return { exists };
  }

  @Get('@:nick')
  @HttpCode(HttpStatus.OK)
  async publicProfile(@Param('nick') nick: string) {
    try {
      const bettor = await this.bettorService.findByNick(nick);
      return successResponse<Bettor>(HttpStatus.OK, bettor);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('me/friends')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyFriends(@Req() req: any) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const friends = await this.friendService.getMyFriends(req.user.id);
      return successResponse<Bettor[]>(HttpStatus.OK, friends);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('@:nick/friends')
  @HttpCode(HttpStatus.OK)
  async getPublicFriends(@Param('nick') nick: string) {
    try {
      const friends = await this.friendService.getPublicFriends(nick);
      return successResponse<Bettor[]>(HttpStatus.OK,  friends);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Post('me/friend-requests/:nick/send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendFriendRequest(@Req() req: any, @Param('nick') nick: string) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const friends =  await this.friendService.sendFriendRequest(req.user.id, nick);
      return successResponse(HttpStatus.OK, friends)
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Patch('me/friend-requests/:id/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptFriendRequest(@Req() req: any, @Param('id') id: string) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const friends = await this.friendService.acceptFriendRequest(req.user.id, id);
      return successResponse(HttpStatus.OK, friends)
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Delete('me/friend-requests/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelRequest(@Req() req: any, @Param('id') id: string) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const friends = await this.friendService.cancelFriendRequest(req.user.id, id);
      return successResponse(HttpStatus.OK, friends)
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Delete('me/friend-requests/:id/reject')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async rejectRequest(@Req() req: any, @Param('id') id: string) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const friends = await this.friendService.rejectFriendRequest(req.user.id, id);
      return successResponse(HttpStatus.OK, friends)
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Delete('me/friends/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeFriend(@Req() req: any, @Param('id') id: string) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const friend = await this.friendService.removeFriend(req.user.id, id);
      return successResponse(HttpStatus.OK, friend)
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('me/friend-requests/received')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getReceivedRequests(@Req() req: any) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const friends = await this.friendService.getReceivedRequests(req.user.id);
      return successResponse<BettorFriendRequest[]>(HttpStatus.OK, friends);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('me/friend-requests/sent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getSentRequests(@Req() req: any) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const friends = await this.friendService.getSentRequests(req.user.id);
      return successResponse<BettorFriendRequest[]>(HttpStatus.OK, friends);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
