import { Controller, Get, Body, Patch, Param, Req, UseInterceptors, ClassSerializerInterceptor, UseGuards, UploadedFile, Post, Delete } from '@nestjs/common';
import { BettorService } from './bettor.service';
import { FriendService } from './friend.service';
import { CreateBettorDto } from './dto/create-bettor.dto';
import { UpdateBettorDto } from './dto/update-bettor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarUploadConfig } from '../../config/multer.config';

@Controller('bettor')
@UseInterceptors(ClassSerializerInterceptor)
export class BettorController {
  constructor(
    private readonly bettorService: BettorService,
    private readonly friendService: FriendService
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMyProfile(@Req() req: any) {
    return await this.bettorService.findOne(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', avatarUploadConfig))
  updateProfile(
      @Req() req: any,
      @Body() updateBettorDto: UpdateBettorDto,
      @UploadedFile() avatarFile?: Express.Multer.File
  )
  {
    return this.bettorService.update(req.user.id, updateBettorDto, avatarFile);
  }

  @Get('@:nick')
  async publicProfile(@Param('nick') nick: string) {
    return await this.bettorService.findByNick(nick);
  }

  @Get('me/friends')
  @UseGuards(JwtAuthGuard)
  async getMyFriends(@Req() req: any) {
    return await this.friendService.getMyFriends(req.user.id);
  }

  @Get('@:nick/friends')
  async getPublicFriends(@Param('nick') nick: string) {
    return await this.friendService.getPublicFriends(nick);
  }

  @Post('me/friend-requests/:nick/send')
  @UseGuards(JwtAuthGuard)
  async sendFriendRequest(@Req() req: any, @Param('nick') nick: string) {
    return await this.friendService.sendFriendRequest(req.user.id, nick);
  }

  @Patch('me/friend-requests/:nick/accept')
  @UseGuards(JwtAuthGuard)
  async acceptFriendRequest(@Req() req: any, @Param('nick') nick: string) {
    return await this.friendService.acceptFriendRequest(req.user.id, nick);
  }

  @Delete('me/friend-requests/:nick/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelRequest(@Req() req: any, @Param('nick') nick: string) {
    // Chama a função específica de cancelar (quando és o Remetente)
    return await this.friendService.cancelFriendRequest(req.user.id, nick);
  }

  @Delete('me/friend-requests/:nick/reject')
  @UseGuards(JwtAuthGuard)
  async rejectRequest(@Req() req: any, @Param('nick') nick: string) {
    // Chama a função específica de rejeitar (quando és o Destinatário)
    return await this.friendService.rejectFriendRequest(req.user.id, nick);
  }

  @Delete('me/friends/:nick')
  @UseGuards(JwtAuthGuard)
  async removeFriend(@Req() req: any, @Param('nick') nick: string) {
    return await this.friendService.removeFriend(req.user.id, nick);
  }
}
