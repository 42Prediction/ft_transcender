import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { AdmUpdateUserDto } from './dto/admin-update-user.dto';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  async create(@Body() createUserDto: AdmUpdateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Patch('me')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  admUpdate(@Param('id') id: string, @Body() dto: AdmUpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete('me')
  remove(@Req() req) {
    return this.userService.remove(req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  admRemove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // Mudar de users para Better a lincagem
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