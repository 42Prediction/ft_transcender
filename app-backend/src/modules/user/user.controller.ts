import { Controller, Get, Param, Put, Body, Post, Req, Delete, Patch } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll() {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() body) {
    return this.userService.create(body);
  }

  @Put(':username')
  update(@Param('username') username: string, @Body() body) {
    return this.userService.updateUser(username, body);
  }

  @Get(':username/friends')
  getFriends(@Param('username') username: string){
    return this.userService.getFriends(username);
  }

  // adicionado para lidar com string 1. Rota para o perfil (MANTÉM ESTA)
  @Get(':username') // Mantemos :username como string
  getProfile(@Param('username') username: string) {
    // Se o username for numérico, a lógica abaixo deve tratar
    // ou podes verificar:
    return this.userService.getProfile(username);
  }

  // Substitui este método:
  /*@Get(':id/friends')
  getFriends(@Param('id') id: string){ // O Param continua como string na rota, mas vamos tratar como ID
    return this.userService.getFriends(Number(id)); // Converte para número
  }*/

  @Post(':username/friends/:friendUsername')
  async addFriend(
    @Param('username') username: string, 
    @Param('friendUsername') friendUsername: string // Mudou de number para string
  ) {
    return this.userService.addFriend(username, friendUsername);
  }

  @Delete(':username/friends/:friendUsername')
  async removeFriend(
    @Param('username') username: string,
    @Param('friendUsername') friendUsername: string
  ) {
    return this.userService.removeFriend(username, friendUsername);
  }

  // Temporario para testar o online e offline usando POST
  @Patch(':username/status')
  async setStatus(@Param('username') username: string, @Body() body: { is_online: boolean }) {
    return this.userService.updateStatus(username, body.is_online);
  }
}