import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MarketService } from './market.service';
import { School42Service } from '../school42/school42.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { PlaceBetDto } from './dto/place-bet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Role } from '../../shared/enums/roles.enum';
import { MarketResolution } from './entities/market.entity';
import { errorResponse, successResponse } from '../../shared/helper/api-response.helper';

@Controller('market')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly school42Service: School42Service,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    try {
      const data = await this.marketService.findAll(category, status, search);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('trending')
  @HttpCode(HttpStatus.OK)
  async trending(@Query('limit') limit?: string) {
    try {
      const data = await this.marketService.findTrending(limit ? Number(limit) : 4);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async stats() {
    try {
      const data = await this.marketService.getStats();
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('leaderboard')
  @HttpCode(HttpStatus.OK)
  async leaderboard(@Query('limit') limit?: string) {
    try {
      const data = await this.marketService.getLeaderboard(limit ? Number(limit) : 6);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('activity')
  @HttpCode(HttpStatus.OK)
  async activity(@Query('limit') limit?: string) {
    try {
      const data = await this.marketService.getActivity(limit ? Number(limit) : 10);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async categories() {
    try {
      const data = await this.marketService.getCategoryStats();
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async myPortfolio(@Req() req: any) {
    try {
      const data = await this.marketService.getMyPortfolio(req.user.id);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('students/search')
  @HttpCode(HttpStatus.OK)
  async searchStudents(@Query('q') q: string, @Query('limit') limit?: string) {
    try {
      const data = await this.school42Service.searchStudents(q ?? '', limit ? Number(limit) : 10);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('students/top')
  @HttpCode(HttpStatus.OK)
  async topStudents(@Query('limit') limit?: string) {
    try {
      const data = await this.school42Service.getTopStudents(limit ? Number(limit) : 20);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.marketService.findOne(id);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMarketDto, @Req() req: any) {
    try {
      const data = await this.marketService.create(dto, req.user.id);
      return successResponse(HttpStatus.CREATED, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Post(':id/bet')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async placeBet(@Param('id') id: string, @Body() dto: PlaceBetDto, @Req() req: any) {
    try {
      const data = await this.marketService.placeBet(id, req.user.id, dto);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async resolve(
    @Param('id') id: string,
    @Body('resolution') resolution: MarketResolution,
  ) {
    try {
      const data = await this.marketService.resolveMarket(id, resolution);
      return successResponse(HttpStatus.OK, data);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
