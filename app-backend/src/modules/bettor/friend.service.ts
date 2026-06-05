import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bettor } from './entities/bettor.entity';
import { BettorFriendRequest, RequestStatus } from './entities/bettor-friend-request.entity';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepository: Repository<Bettor>,
    
    @InjectRepository(BettorFriendRequest)
    private readonly requestRepository: Repository<BettorFriendRequest>,
  ) {}

  /* ========================================================================== */
  /* [MARCO] - SISTEMA DE AMIZADES                                              */
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

  // 4. Cancelar um Pedido Enviado por engano
  async cancelFriendRequest(userId: string, targetNick: string): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { sender: { user: { id: userId } }, receiver: { nick: targetNick }, status: RequestStatus.PENDING },
    });

    if (!request) throw new NotFoundException('Pedido de amizade não encontrado');
    await this.requestRepository.remove(request);
  }

  // 5. Remover uma Amizade já existente
  async removeFriend(userId: string, friendNick: string): Promise<void> {
    // 1. Carrega o perfil e os teus amigos
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });
    
    // 2. Carrega o perfil do amigo e os amigos DELE
    const friendBettor = await this.bettorRepository.findOne({ 
      where: { nick: friendNick },
      relations: ['friends'], 
    });

    if (!bettor || !friendBettor) throw new NotFoundException('Perfil ou amigo não encontrado');

    // 3. Remove o amigo da tua lista
    if (bettor.friends) {
      bettor.friends = bettor.friends.filter(f => f.id !== friendBettor.id);
    }
    
    // 4. Remove-te a ti da lista do amigo
    if (friendBettor.friends) {
      friendBettor.friends = friendBettor.friends.filter(f => f.id !== bettor.id);
    }

    // 5. Guarda os dois perfis atualizados na BD de uma só vez
    await this.bettorRepository.save([bettor, friendBettor]);
    
    // 6. Apaga também o registo antigo da tabela de pedidos para limpeza
    await this.requestRepository.delete({
      sender: { id: bettor.id }, receiver: { id: friendBettor.id }
    });
    await this.requestRepository.delete({
      sender: { id: friendBettor.id }, receiver: { id: bettor.id }
    });
  }

  // 6. Listar Pedidos Recebidos (Pendentes)
  async getReceivedRequests(userId: string): Promise<BettorFriendRequest[]> {
    return await this.requestRepository.find({
      where: { 
        receiver: { user: { id: userId } }, 
        status: RequestStatus.PENDING 
      },
      // Trazemos os dados do 'sender' para sabermos quem nos enviou o convite
      relations: ['sender'], 
    });
  }

  // 7. Listar Pedidos Enviados (Pendentes)
  async getSentRequests(userId: string): Promise<BettorFriendRequest[]> {
    return await this.requestRepository.find({
      where: { 
        sender: { user: { id: userId } }, 
        status: RequestStatus.PENDING 
      },
      // Trazemos os dados do 'receiver' para sabermos a quem enviámos
      relations: ['receiver'], 
    });
  }
  /* ========================================================================== */
  /* [MARCO] - FIM DO BLOCO DE AMIZADES                                         */
  /* ========================================================================== */
}