import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { errorResponse, successResponse } from '../../shared/helper/api-response.helper';
import { NotificationService } from './notification.service';
import { BettorService } from '../bettor/bettor.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly bettorService: BettorService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Req() req: any) {
    try {
      const bettor = await this.bettorService.findOne(req.user.id);
      if (!bettor) return successResponse(HttpStatus.OK, { items: [], unread: 0 });
      const [items, unread] = await Promise.all([
        this.notificationService.list(bettor.id),
        this.notificationService.unreadCount(bettor.id),
      ]);
      return successResponse(HttpStatus.OK, { items, unread });
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@Req() req: any) {
    try {
      const bettor = await this.bettorService.findOne(req.user.id);
      if (bettor) await this.notificationService.markAllRead(bettor.id);
      return successResponse(HttpStatus.OK, { success: true });
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(@Req() req: any, @Param('id') id: string) {
    try {
      const bettor = await this.bettorService.findOne(req.user.id);
      if (bettor) await this.notificationService.markRead(bettor.id, id);
      return successResponse(HttpStatus.OK, { success: true });
    } catch (error) {
      return errorResponse(error);
    }
  }
}
