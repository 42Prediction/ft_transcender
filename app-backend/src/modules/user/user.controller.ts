import { Controller, Get, Param, Put, Body, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  getAll() {
    return this.userService.findAll();
  }

  @Get(':username')
  getProfile(@Param('username') username: string) {
    return this.userService.getProfile(username);
  }

  @Post()
  create(@Body() body) {
    return this.userService.create(body);
  }

  @Put(':username')
  update(@Param('username') username: string, @Body() body) {
    return this.userService.updateUser(username, body);
  }
}
