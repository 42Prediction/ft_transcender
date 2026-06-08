import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bettor } from './entities/bettor.entity';
import { BettorFriendRequest, RequestStatus } from './entities/friend.entity';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepository: Repository<Bettor>,
    
    @InjectRepository(BettorFriendRequest)
    private readonly requestRepository: Repository<BettorFriendRequest>,
  ) {}

  async getMyFriends(userId: string): Promise<Bettor[]> {
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });
    if (!bettor) throw new NotFoundException('Perfil não encontrado');
    return bettor.friends || [];
  }

  async getPublicFriends(nick: string): Promise<Bettor[]> {
    const bettor = await this.bettorRepository.findOne({
      where: { nick },
      relations: ['friends'],
    });
    if (!bettor) throw new NotFoundException('Perfil não encontrado');
    return bettor.friends || [];
  }

  async sendFriendRequest(userId: string, targetNick: string): Promise<void> {
    const sender = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });
    const receiver = await this.bettorRepository.findOne({ where: { nick: targetNick } });

    if (!sender || !receiver) throw new NotFoundException('Perfil não encontrado');
    if (sender.id === receiver.id) throw new BadRequestException('Não podes adicionar-te a ti mesmo');

    if (sender.friends && sender.friends.some(f => f.id === receiver.id)) {
      throw new ConflictException('Vocês já são amigos');
    }

    const existingRequest = await this.requestRepository.findOne({
      where: [
        { sender: { id: sender.id }, receiver: { id: receiver.id } },
        { sender: { id: receiver.id }, receiver: { id: sender.id } },
      ],
    });

    if (existingRequest) throw new ConflictException('Já existe um pedido pendente com este jogador');

    const newRequest = this.requestRepository.create({
      sender,
      receiver,
      status: RequestStatus.PENDING,
    });
    await this.requestRepository.save(newRequest);
  }

  async acceptFriendRequest(userId: string, senderNick: string): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { receiver: { user: { id: userId } }, sender: { nick: senderNick }, status: RequestStatus.PENDING },
      relations: ['sender', 'receiver', 'sender.friends', 'receiver.friends'],
    });

    if (!request) throw new NotFoundException('Pedido de amizade pendente não encontrado');

    if (!request.sender.friends) request.sender.friends = [];
    if (!request.receiver.friends) request.receiver.friends = [];

    request.sender.friends.push(request.receiver);
    request.receiver.friends.push(request.sender);

    request.status = RequestStatus.ACCEPTED;
    await this.requestRepository.save(request);
    await this.bettorRepository.save([request.sender, request.receiver]);
  }

  async rejectFriendRequest(userId: string, senderNick: string): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { receiver: { user: { id: userId } }, sender: { nick: senderNick }, status: RequestStatus.PENDING },
    });

    if (!request) throw new NotFoundException('Pedido de amizade não encontrado');
    await this.requestRepository.remove(request);
  }

  async cancelFriendRequest(userId: string, targetNick: string): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { sender: { user: { id: userId } }, receiver: { nick: targetNick }, status: RequestStatus.PENDING },
    });

    if (!request) throw new NotFoundException('Pedido de amizade não encontrado');
    await this.requestRepository.remove(request);
  }

  async removeFriend(userId: string, friendNick: string): Promise<void> {
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });

    const friendBettor = await this.bettorRepository.findOne({ 
      where: { nick: friendNick },
      relations: ['friends'], 
    });

    if (!bettor || !friendBettor) throw new NotFoundException('Perfil ou amigo não encontrado');

    if (bettor.friends) {
      bettor.friends = bettor.friends.filter(f => f.id !== friendBettor.id);
    }

    if (friendBettor.friends) {
      friendBettor.friends = friendBettor.friends.filter(f => f.id !== bettor.id);
    }

    await this.bettorRepository.save([bettor, friendBettor]);

    await this.requestRepository.delete({
      sender: { id: bettor.id }, receiver: { id: friendBettor.id }
    });
    await this.requestRepository.delete({
      sender: { id: friendBettor.id }, receiver: { id: bettor.id }
    });
  }

  async getReceivedRequests(userId: string): Promise<BettorFriendRequest[]> {
    return await this.requestRepository.find({
      where: { 
        receiver: { user: { id: userId } }, 
        status: RequestStatus.PENDING 
      },
      relations: ['sender'], 
    });
  }

  async getSentRequests(userId: string): Promise<BettorFriendRequest[]> {
    return await this.requestRepository.find({
      where: { 
        sender: { user: { id: userId } }, 
        status: RequestStatus.PENDING 
      },
      relations: ['receiver'], 
    });
  }
}