import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  // Enviar pedido - Aceita ID (number) ou Username (string) para o recetor
  async sendRequest(senderId: number, receiverIdOrUsername: string | number): Promise<FriendRequest> {
    const sender = await this.userRepo.findOneBy({ id: senderId });
    if (!sender) throw new NotFoundException('Utilizador remetente não encontrado');

    // Verifica se o valor recebido é puramente numérico
    const isNumeric = !isNaN(Number(receiverIdOrUsername));
    
    // Procura o recetor por ID ou por Username conforme o tipo de dado introduzido
    const receiver = await this.userRepo.findOne({
      where: isNumeric 
        ? { id: Number(receiverIdOrUsername) } 
        : { username: String(receiverIdOrUsername) }
    });

    if (!receiver) throw new NotFoundException('Utilizador destino não encontrado');
    if (sender.id === receiver.id) throw new BadRequestException('Não podes enviar um pedido de amizade a ti mesmo');

    // Verifica se já existe um pedido pendente ou aceite entre ambos
    const existingRequest = await this.requestRepo.findOne({
      where: [
        { sender: { id: sender.id }, receiver: { id: receiver.id } },
        { sender: { id: receiver.id }, receiver: { id: sender.id } }
      ]
    });

    if (existingRequest) {
      throw new BadRequestException('Já existe um pedido pendente ou amizade estabelecida');
    }

    const newRequest = this.requestRepo.create({ 
      sender, 
      receiver, 
      status: FriendRequestStatus.PENDING 
    });
    
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
    const request = await this.requestRepo.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver']
    });
    if (!request) throw new NotFoundException('Pedido não encontrado');

    request.status = FriendRequestStatus.ACCEPTED;
    return await this.requestRepo.save(request);
  }

  // Rejeitar pedido de amizade
  async rejectRequest(requestId: number): Promise<void> {
    await this.requestRepo.delete(requestId);
  }
}