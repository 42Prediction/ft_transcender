import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ClassSerializerInterceptor, UseGuards, Req, HttpStatus, HttpCode} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { AdmUpdateUserDto } from './dto/admin-update-user.dto';
import { User } from './entities/user.entity';
import { errorResponse, successResponse, unauthorizedResponse } from '../../shared/helper/api-response.helper';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async create(@Body() createUserDto: AdmUpdateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return successResponse<User>(HttpStatus.OK, user);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return successResponse<User[]>(HttpStatus.OK, users);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('me')
  @UseGuards(OptionalJwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req){
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const user = await this.userService.findOne(req.user.id);
      return successResponse<User>(HttpStatus.OK, user);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const user = await this.userService.findOne(id);
      return successResponse<User>(HttpStatus.OK, user);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async updateMe(@Req() req, @Body() dto: UpdateUserDto) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      const user = await this.userService.update(req.user.id, dto);
      return successResponse<User>(HttpStatus.OK, user);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req) {
    if (!req.user?.id) return unauthorizedResponse();
    try {
      await this.userService.remove(req.user.id);
      return successResponse(HttpStatus.OK, null);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async admUpdate(@Param('id') id: string, @Body() dto: AdmUpdateUserDto) {
    try {
     const user = await this.userService.update(id, dto);
      return successResponse<User>(HttpStatus.OK, user);
    } catch (error) {
      return errorResponse(error);
    }
  }
  
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async admRemove(@Param('id') id: string) {
    try {
      await this.userService.remove(id);
      return successResponse(HttpStatus.OK, null);
    } catch (error) {
      return errorResponse(error);
    }
  }

}
