import { Controller, Get, Post, Delete, Body, Patch, Param, Req, UseInterceptors, ClassSerializerInterceptor, UseGuards } from '@nestjs/common';
import { BettorService } from './bettor.service';
import { CreateBettorDto } from './dto/create-bettor.dto';
import { UpdateBettorDto } from './dto/update-bettor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bettor')
@UseInterceptors(ClassSerializerInterceptor)
export class BettorController {
  constructor(private readonly bettorService: BettorService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMyProfile(@Req() req: any) {
    return  await this.bettorService.findOne(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: any, @Body() updateBettorDto: UpdateBettorDto) {
    return this.bettorService.update(req.user.id, updateBettorDto);
  }

  @Get('@:nick')
  async publicProfile(@Param('nick') nick: string) {
    return await this.bettorService.findByNick(nick);
  }

/* ========================================================================== */
  /* [MARCO] - SISTEMA DE AMIZADES E ESTADOS                                    */
  /* Endpoints REST para interagir com pedidos e lista de amigos                */
  /* ========================================================================== */

  @Get('me/friends')
  @UseGuards(JwtAuthGuard)
  async getMyFriends(@Req() req: any) {
    return await this.bettorService.getMyFriends(req.user.id);
  }

  @Get('@:nick/friends')
  async getPublicFriends(@Param('nick') nick: string) {
    return await this.bettorService.getPublicFriends(nick);
  }

  // Enviar pedido de amizade
  @Post('me/friend-requests/:nick/send')
  @UseGuards(JwtAuthGuard)
  async sendFriendRequest(@Req() req: any, @Param('nick') nick: string) {
    return await this.bettorService.sendFriendRequest(req.user.id, nick);
  }

  // Cancelar um pedido que tu enviaste por engano
  @Delete('me/friend-requests/:nick/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelFriendRequest(@Req() req: any, @Param('nick') nick: string) {
    return await this.bettorService.cancelFriendRequest(req.user.id, nick);
  }

  // Aceitar um pedido que recebeste
  @Patch('me/friend-requests/:nick/accept')
  @UseGuards(JwtAuthGuard)
  async acceptFriendRequest(@Req() req: any, @Param('nick') nick: string) {
    return await this.bettorService.acceptFriendRequest(req.user.id, nick);
  }

  // Rejeitar um pedido que recebeste
  @Delete('me/friend-requests/:nick/reject')
  @UseGuards(JwtAuthGuard)
  async rejectFriendRequest(@Req() req: any, @Param('nick') nick: string) {
    return await this.bettorService.rejectFriendRequest(req.user.id, nick);
  }

  // Desfazer amizade
  @Delete('me/friends/:nick')
  @UseGuards(JwtAuthGuard)
  async removeFriend(@Req() req: any, @Param('nick') nick: string) {
    return await this.bettorService.removeFriend(req.user.id, nick);
  }

  // Atualizar estado
  @Patch('me/status')
  @UseGuards(JwtAuthGuard)
  async setStatus(@Req() req: any, @Body() body: { is_online: boolean }) {
    return await this.bettorService.updateStatus(req.user.id, body.is_online);
  }

  /* ========================================================================== */
  /* [MARCO] - FIM DO BLOCO DE AMIZADES E ESTADOS                               */
  /* ========================================================================== */
}
