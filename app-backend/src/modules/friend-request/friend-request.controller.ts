import { Controller, Post, Get, Patch, Body, Param, Delete } from '@nestjs/common';
import { FriendRequestService } from './friend-request.service';

@Controller('friend-requests')
export class FriendRequestController {
  constructor(private readonly service: FriendRequestService) {}

  @Post()
  async create(@Body() body: { senderId: number; receiverId: string | number }) {
    return await this.service.sendRequest(body.senderId, body.receiverId);
  }

  @Get('pending/:userId')
  async getPending(@Param('userId') userId: number) {
    return await this.service.getPendingRequests(Number(userId));
  }

  @Patch(':id/accept')
  async accept(@Param('id') id: number) {
    return await this.service.acceptRequest(Number(id));
  }

  @Delete(':id/reject')
  async reject(@Param('id') id: number) {
    return await this.service.rejectRequest(Number(id));
  }
}