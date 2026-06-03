import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateBettorDto } from './dto/update-bettor.dto';
import { User } from '../user/entities/user.entity';
import { Bettor } from './entities/bettor.entity';
import { createAvatar } from '@dicebear/core';
import { avataaarsNeutral } from '@dicebear/collection';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
// [MARCO]
import { BettorFriendRequest, RequestStatus } from './entities/bettor-friend-request.entity';

@Injectable()
export class BettorService {
  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepository: Repository<Bettor>,
    // [MARCO] - Injeção do repositório da nova tabela de pedidos
    @InjectRepository(BettorFriendRequest)
    private readonly requestRepository: Repository<BettorFriendRequest>,
  ) {}

  async create(user: User): Promise<Bettor> {
    if (!user) {
      throw new InternalServerErrorException('User id required');
    }

    const avatar = createAvatar(avataaarsNeutral, {
      seed: user.email,
    });
    const avatarUri = avatar.toDataUri();

    const emailPrefix = user.email.split('@')[0];
    const cleanPrefix = emailPrefix
      .substring(0, 20)
      .replace(/[^a-zA-O0-9_.]/g, '');
    const temporaryNick = `${cleanPrefix}_${Math.floor(1000 + Math.random() * 9000)}`;
    const bettor: Bettor = this.bettorRepository.create({
      nick: temporaryNick,
      avatar: avatarUri,
      user: user,
    });
    return await this.bettorRepository.save(bettor);
  }

  async findOne(id: string ): Promise<Bettor | null>{
    return this.bettorRepository.findOne({
      where: { user: { id } },
      relations: ['user'],
    });
  }

  // async update(id: number, updateBettorDto: UpdateBettorDto) {
  //   return `This action updates a #${id} bettor`;
  // }

  async findByNick(nick: string): Promise<Bettor> {
    const bettor = await this.bettorRepository.findOne({ where: { nick } });
    if (!bettor) throw new NotFoundException('Bettor not found');
    return bettor;
  }

  async update(userId: string, updateBettorDto: UpdateBettorDto) {
    const bettor = await this.bettorRepository.findOne({
    where: {
        user: {
          id: userId,
        },
      },
      relations: ['user'],
    });
    if (!bettor) throw new NotFoundException('Bettor not found');
    if (updateBettorDto.nick && updateBettorDto.nick !== bettor.nick) {
      const nickAlreadyExists = await this.bettorRepository.findOne({
        where: {
          nick: updateBettorDto.nick,
        },
      });
      if (nickAlreadyExists)
        throw new ConflictException('Nick already in use, chose another');
      bettor.isNickSetted = true;
    }
    if (updateBettorDto)
    Object.assign(bettor, updateBettorDto);
    return await this.bettorRepository.save(bettor);
  }

/* ========================================================================== */
  /* [MARCO] - SISTEMA DE AMIZADES E ESTADOS                                    */
  /* Lógica de negócio para gerir pedidos (Requests) e conexões entre jogadores */
  /* ========================================================================== */

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

  // 1. Enviar um Pedido de Amizade
  async sendFriendRequest(userId: string, targetNick: string): Promise<void> {
    const sender = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });
    const receiver = await this.bettorRepository.findOne({ where: { nick: targetNick } });

    if (!sender || !receiver) throw new NotFoundException('Perfil não encontrado');
    if (sender.id === receiver.id) throw new BadRequestException('Não podes adicionar-te a ti mesmo');

    // Verifica se já são amigos
    if (sender.friends && sender.friends.some(f => f.id === receiver.id)) {
      throw new ConflictException('Vocês já são amigos');
    }

    // Verifica se já existe um pedido (em qualquer direção)
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

  // 2. Aceitar um Pedido de Amizade
  async acceptFriendRequest(userId: string, senderNick: string): Promise<void> {
    // Procura o pedido onde tu és o destinatário (receiver) e o alvo é o remetente (sender)
    const request = await this.requestRepository.findOne({
      where: { receiver: { user: { id: userId } }, sender: { nick: senderNick }, status: RequestStatus.PENDING },
      relations: ['sender', 'receiver', 'sender.friends', 'receiver.friends'],
    });

    if (!request) throw new NotFoundException('Pedido de amizade pendente não encontrado');

    // Inicializa os arrays se estiverem nulos
    if (!request.sender.friends) request.sender.friends = [];
    if (!request.receiver.friends) request.receiver.friends = [];

    // Adiciona a relação cruzada nos dois perfis
    request.sender.friends.push(request.receiver);
    request.receiver.friends.push(request.sender);

    // Marca o pedido como aceite e guarda as alterações
    request.status = RequestStatus.ACCEPTED;
    await this.requestRepository.save(request);
    await this.bettorRepository.save([request.sender, request.receiver]);
  }

  // 3. Rejeitar um Pedido de Amizade (Apaga a linha da BD)
  async rejectFriendRequest(userId: string, senderNick: string): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { receiver: { user: { id: userId } }, sender: { nick: senderNick }, status: RequestStatus.PENDING },
    });

    if (!request) throw new NotFoundException('Pedido de amizade não encontrado');
    await this.requestRepository.remove(request);
  }

  // 4. Cancelar um Pedido Enviado por engano (O teu código defensivo!)
  async cancelFriendRequest(userId: string, targetNick: string): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { sender: { user: { id: userId } }, receiver: { nick: targetNick }, status: RequestStatus.PENDING },
    });

    if (!request) throw new NotFoundException('Pedido de amizade não encontrado');
    await this.requestRepository.remove(request);
  }

  // 5. Remover uma Amizade já existente
  async removeFriend(userId: string, friendNick: string): Promise<void> {
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });
    const friendBettor = await this.bettorRepository.findOne({ where: { nick: friendNick } });

    if (!bettor || !friendBettor) throw new NotFoundException('Perfil ou amigo não encontrado');

    if (bettor.friends) {
      bettor.friends = bettor.friends.filter(f => f.id !== friendBettor.id);
      await this.bettorRepository.save(bettor);
      
      // Apaga também o registo antigo da tabela de pedidos para limpeza (Opcional, mas limpo)
      await this.requestRepository.delete({
        sender: { id: bettor.id }, receiver: { id: friendBettor.id }
      });
      await this.requestRepository.delete({
        sender: { id: friendBettor.id }, receiver: { id: bettor.id }
      });
    }
  }

  // Atualiza o estado online/offline
  async updateStatus(userId: string, isOnline: boolean): Promise<Bettor> {
    const bettor = await this.bettorRepository.findOne({ where: { user: { id: userId } } });
    if (!bettor) throw new NotFoundException('Perfil não encontrado');
    bettor.isOnline = isOnline;
    return await this.bettorRepository.save(bettor);
  }

  /* ========================================================================== */
  /* [MARCO] - FIM DO BLOCO DE AMIZADES E ESTADOS                               */
  /* ========================================================================== */

}
