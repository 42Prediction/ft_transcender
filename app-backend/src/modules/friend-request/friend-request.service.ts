import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from './friend-request.entity';
import { User } from '../user/user.entity';

@Injectable()
export class FriendRequestService {
  constructor(
    @InjectRepository(FriendRequest) private requestRepo: Repository<FriendRequest>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  // Enviar pedido
  async sendRequest(senderId: number, receiverId: number): Promise<FriendRequest> {
    const sender = await this.userRepo.findOneBy({ id: senderId });
    const receiver = await this.userRepo.findOneBy({ id: receiverId });
    
    if (!sender || !receiver) throw new NotFoundException('Utilizador não encontrado');

    const newRequest = this.requestRepo.create({ sender, receiver, status: FriendRequestStatus.PENDING });
    return await this.requestRepo.save(newRequest);
  }

  // Listar pedidos pendentes
  async getPendingRequests(userId: number): Promise<FriendRequest[]> {
    return await this.requestRepo.find({
      where: { receiver: { id: userId }, status: FriendRequestStatus.PENDING },
      relations: ['sender'],
    });
  }

  // Aceitar pedido amizade
  async acceptRequest(requestId: number): Promise<FriendRequest> {
    const request = await this.requestRepo.findOneBy({ id: requestId });
    if (!request) throw new NotFoundException('Pedido não encontrado');

    request.status = FriendRequestStatus.ACCEPTED;
    return await this.requestRepo.save(request);
  }

  // rejeitar pedido de amizade
  async rejectRequest(requestId: number): Promise<void> {
    await this.requestRepo.delete(requestId);
  }
}