import { Controller, Get, Body, Patch, Param, Req, UseInterceptors, ClassSerializerInterceptor, UseGuards } from '@nestjs/common';
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
}
