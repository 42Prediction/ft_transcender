import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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

async sendFriendRequest(userId: string, receiverNick: string): Promise<void> {
    const sender = await this.bettorRepository.findOne({ where: { user: { id: userId } } });
    const receiver = await this.bettorRepository.findOne({ where: { nick: receiverNick } });

    if (!sender || !receiver) throw new NotFoundException('Perfil não encontrado');
    if (sender.id === receiver.id) throw new BadRequestException('Não podes enviar um pedido de amizade a ti mesmo');

    // 1. Verifica se já são amigos de forma atómica e leve (sem carregar arrays)
    const friendsCount = await this.bettorRepository.createQueryBuilder('bettor')
      .leftJoin('bettor.friends', 'friend')
      .where('bettor.id = :senderId AND friend.id = :receiverId', { senderId: sender.id, receiverId: receiver.id })
      .getCount();

    if (friendsCount > 0) throw new ConflictException('Já são amigos');

    try {
      // 2. Transação SERIALIZABLE: Bloqueia leituras fantasmas cruzadas no mesmo milissegundo
      await this.requestRepository.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
        
        // Verifica se já existe um pedido em QUALQUER direção
        const existingRequest = await transactionalEntityManager.findOne(BettorFriendRequest, {
          where: [
            { sender: { id: sender.id }, receiver: { id: receiver.id } },
            { sender: { id: receiver.id }, receiver: { id: sender.id } }
          ]
        });

        if (existingRequest) {
          throw new ConflictException('Já existe um pedido de amizade pendente entre vocês');
        }

        // 3. Cria e guarda o pedido de forma segura
        const newRequest = transactionalEntityManager.create(BettorFriendRequest, {
          sender: { id: sender.id },
          receiver: { id: receiver.id },
          status: RequestStatus.PENDING,
        });

        await transactionalEntityManager.save(newRequest);
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      
      // Cast (Type Assertion) seguro para aceder à propriedade 'code' do PostgreSQL
      const dbError = error as { code?: string };
      
      // Proteção de redundância: Erro 23505 (Unique Constraint do PostgreSQL) para cliques duplos
      if (dbError.code === '23505') {
        throw new ConflictException('O pedido de amizade já foi enviado');
      }
      throw new InternalServerErrorException('Erro ao enviar o pedido de amizade');
    }
  }

  async acceptFriendRequest(userId: string, senderNick: string): Promise<void> {
    const receiver = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
    });
    const sender = await this.bettorRepository.findOne({
      where: { nick: senderNick },
    });

    if (!receiver || !sender) {
      throw new NotFoundException('Perfil ou remetente não encontrado');
    }

    await this.bettorRepository.manager.transaction(async (transactionalEntityManager) => {

      const updateResult = await transactionalEntityManager.update(
        BettorFriendRequest,
        { 
          sender: { id: sender.id }, 
          receiver: { id: receiver.id }, 
          status: RequestStatus.PENDING 
        },
        { status: RequestStatus.ACCEPTED }
      );

      if (updateResult.affected === 0) {
        throw new ConflictException('O pedido de amizade já não está pendente ou não existe');
      }

      await transactionalEntityManager.createQueryBuilder()
        .relation(Bettor, 'friends')
        .of(sender.id)
        .add(receiver.id);

      await transactionalEntityManager.createQueryBuilder()
        .relation(Bettor, 'friends')
        .of(receiver.id)
        .add(sender.id);
    });
  }

async rejectFriendRequest(userId: string, senderNick: string): Promise<void> {
    const receiver = await this.bettorRepository.findOne({ where: { user: { id: userId } } });
    const sender = await this.bettorRepository.findOne({ where: { nick: senderNick } });

    if (!receiver || !sender) throw new NotFoundException('Perfil ou remetente não encontrado');

    const deleteResult = await this.requestRepository.delete({
      receiver: { id: receiver.id },
      sender: { id: sender.id },
      status: RequestStatus.PENDING,
    });

    if (deleteResult.affected === 0) {
      throw new NotFoundException('Pedido de amizade pendente não encontrado');
    }
  }

  async cancelFriendRequest(userId: string, targetNick: string): Promise<void> {
    const sender = await this.bettorRepository.findOne({ where: { user: { id: userId } } });
    const receiver = await this.bettorRepository.findOne({ where: { nick: targetNick } });

    if (!sender || !receiver) throw new NotFoundException('Perfil ou destinatário não encontrado');

    const deleteResult = await this.requestRepository.delete({
      sender: { id: sender.id },
      receiver: { id: receiver.id },
      status: RequestStatus.PENDING,
    });

    if (deleteResult.affected === 0) {
      throw new NotFoundException('Pedido de amizade pendente não encontrado');
    }
  }

  async removeFriend(userId: string, friendNick: string): Promise<void> {
    // 1. Procuramos apenas os IDs, sem carregar os arrays de friends (mais rápido e seguro)
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
    });

    const friendBettor = await this.bettorRepository.findOne({ 
      where: { nick: friendNick },
    });

    if (!bettor || !friendBettor) throw new NotFoundException('Perfil ou amigo não encontrado');

    // 2. Remoção atómica bidirecional diretamente na base de dados
    await this.bettorRepository.createQueryBuilder()
      .relation(Bettor, 'friends')
      .of(bettor.id)
      .remove(friendBettor.id);

    await this.bettorRepository.createQueryBuilder()
      .relation(Bettor, 'friends')
      .of(friendBettor.id)
      .remove(bettor.id);

    // 3. Limpar o histórico de pedidos
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