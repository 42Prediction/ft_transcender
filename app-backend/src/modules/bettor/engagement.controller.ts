import { Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { errorResponse, successResponse } from '../../shared/helper/api-response.helper';
import { EngagementService } from './engagement.service';

@Controller('engagement')
@UseGuards(JwtAuthGuard)
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get('daily')
  @HttpCode(HttpStatus.OK)
  async dailyStatus(@Req() req: any) {
    try {
      const status = await this.engagementService.getDailyStatus(req.user.id);
      return successResponse(HttpStatus.OK, status);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Post('daily/claim')
  @HttpCode(HttpStatus.OK)
  async claimDaily(@Req() req: any) {
    try {
      const result = await this.engagementService.claimDaily(req.user.id);
      return successResponse(HttpStatus.OK, result);
    } catch (error) {
      return errorResponse(error);
    }
  }
}
