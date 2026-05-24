import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BettorService } from './bettor.service';
import { CreateBettorDto } from './dto/create-bettor.dto';
import { UpdateBettorDto } from './dto/update-bettor.dto';

@Controller('bettor')
export class BettorController {
  constructor(private readonly bettorService: BettorService) {}

  @Post()
  create(@Body() createBettorDto: CreateBettorDto) {
    return 'test';
  }

  @Get()
  findAll() {
    return this.bettorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bettorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBettorDto: UpdateBettorDto) {
    return this.bettorService.update(+id, updateBettorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bettorService.remove(+id);
  }
}
