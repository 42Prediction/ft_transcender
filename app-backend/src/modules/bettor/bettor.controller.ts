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

  /* ======================================================================== */
  /* ENDPOINTS ADICIONADOS DA MIGRAÇÃO - Marco                                */
  /* ======================================================================== */

  // Rota para ver a minha própria lista de amigos
  @Get('me/friends')
  @UseGuards(JwtAuthGuard)
  async getMyFriends(@Req() req: any) {
    return await this.bettorService.getMyFriends(req.user.id);
  }

  // Rota para ver a lista de amigos de um perfil público através do nick
  @Get('@:nick/friends')
  async getPublicFriends(@Param('nick') nick: string) {
    return await this.bettorService.getPublicFriends(nick);
  }

  // Rota para adicionar um amigo de forma segura (Usa o teu JWT + o nick do amigo)
  @Post('me/friends/:friendNick')
  @UseGuards(JwtAuthGuard)
  async addFriend(@Req() req: any, @Param('friendNick') friendNick: string) {
    return await this.bettorService.addFriend(req.user.id, friendNick);
  }

  // Rota para remover um amigo de forma segura (Usa o teu JWT + o nick do amigo)
  @Delete('me/friends/:friendNick')
  @UseGuards(JwtAuthGuard)
  async removeFriend(@Req() req: any, @Param('friendNick') friendNick: string) {
    return await this.bettorService.removeFriend(req.user.id, friendNick);
  }

  // Rota para atualizar o estado online/offline do utilizador autenticado
  @Patch('me/status')
  @UseGuards(JwtAuthGuard)
  async setStatus(@Req() req: any, @Body() body: { is_online: boolean }) {
    return await this.bettorService.updateStatus(req.user.id, body.is_online);
  }

  /* ======================================================================== */
  /* ENDPOINTS ADICIONADOS DA MIGRAÇÃO - FIM - Marco                          */
  /* ======================================================================== */
}
