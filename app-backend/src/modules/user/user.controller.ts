import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ClassSerializerInterceptor, NotFoundException, UseGuards, Req, Res } from '@nestjs/common';
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
  constructor(
    private readonly userService: UserService,
  ) {}
  
  @Post()
  @Roles('admin')
  async create(@Body() createUserDto: AdmUpdateUserDto) {
    return  await this.userService.create(createUserDto);
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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req){
    return req.user;
  }
}
