import { Controller, Get, Body, Patch, Param, Req, UseInterceptors, ClassSerializerInterceptor, UseGuards, UploadedFile } from '@nestjs/common';
import { BettorService } from './bettor.service';
import { CreateBettorDto } from './dto/create-bettor.dto';
import { UpdateBettorDto } from './dto/update-bettor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarUploadConfig } from '../../config/multer.config';

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
  @UseInterceptors(FileInterceptor('avatar', avatarUploadConfig))
  updateProfile(@Req() req: any,
  @Body() updateBettorDto: UpdateBettorDto,
  @UploadedFile() avatarFile?: Express.Multer.File,
) {
    return this.bettorService.update(req.user.id, updateBettorDto, avatarFile);
  }

  @Get('@:nick')
  async publicProfile(@Param('nick') nick: string) {
    return await this.bettorService.findByNick(nick);
  }
}
