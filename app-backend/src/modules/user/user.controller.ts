import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ClassSerializerInterceptor, UseGuards, Req} from '@nestjs/common';
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
  async updateMe(@Req() req, @Body() dto: UpdateUserDto) {
    return await this.userService.update(req.user.id, dto);
  }

  @Delete('me')
  async remove(@Req() req) {
    return await this.userService.remove(req.user.id);
  }

  @Patch(':id')
  @Roles('admin')
  async admUpdate(@Param('id') id: string, @Body() dto: AdmUpdateUserDto) {
    return await this.userService.update(id, dto);
  }
  
  @Delete(':id')
  @Roles('admin')
  async admRemove(@Param('id') id: string) {
    return await this.userService.remove(id);
  }

}
