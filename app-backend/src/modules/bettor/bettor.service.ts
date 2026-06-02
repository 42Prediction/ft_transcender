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


@Injectable()
export class BettorService {
  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepository: Repository<Bettor>,
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

  /* ======================================================================== */
  /* COMANDOS DE AMIZADE E ESTADO TOTALMENTE ISOLADOS DENTRO DO BETTOR  Marco */
  /* ======================================================================== */

  // Lista os amigos do utilizador autenticado recorrendo ao userId do JWT
  async getMyFriends(userId: string): Promise<Bettor[]> {
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });
    if (!bettor) throw new NotFoundException('Perfil não encontrado');
    return bettor.friends || [];
  }

  // Lista os amigos de um perfil público qualquer usando o Nick dele
  async getPublicFriends(nick: string): Promise<Bettor[]> {
    const bettor = await this.bettorRepository.findOne({
      where: { nick },
      relations: ['friends'],
    });
    if (!bettor) throw new NotFoundException('Perfil não encontrado');
    return bettor.friends || [];
  }

  // Adiciona amigo usando o ID seguro do JWT do remetente e o Nick do alvo
  async addFriend(userId: string, friendNick: string): Promise<void> {
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });
    const friendBettor = await this.bettorRepository.findOne({
      where: { nick: friendNick },
    });

    if (!bettor || !friendBettor) {
      throw new NotFoundException('Perfil ou amigo não encontrado');
    }
    if (bettor.id === friendBettor.id) {
      throw new BadRequestException('Não podes adicionar-te a ti mesmo');
    }

    if (!bettor.friends) bettor.friends = [];

    const alreadyFriend = bettor.friends.find(f => f.id === friendBettor.id);
    if (!alreadyFriend) {
      bettor.friends.push(friendBettor);
      await this.bettorRepository.save(bettor);
    }
  }

  // Remove amigo usando o ID seguro do JWT e o Nick do alvo
  async removeFriend(userId: string, friendNick: string): Promise<void> {
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });
    const friendBettor = await this.bettorRepository.findOne({
      where: { nick: friendNick },
    });

    if (!bettor || !friendBettor) {
      throw new NotFoundException('Perfil ou amigo não encontrado');
    }

    if (bettor.friends) {
      bettor.friends = bettor.friends.filter(f => f.id !== friendBettor.id);
      await this.bettorRepository.save(bettor);
    }
  }

  // Atualiza o estado online/offline do perfil do utilizador correspondente ao JWT
  async updateStatus(userId: string, isOnline: boolean): Promise<Bettor> {
    const bettor = await this.bettorRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!bettor) throw new NotFoundException('Perfil não encontrado');
    
    bettor.isOnline = isOnline;
    return await this.bettorRepository.save(bettor);
  }
  /* ======================================================================== */
  /* COMANDOS DE AMIZADE E ESTADO TOTALMENTE ISOLADOS DENTRO DO BETTOR Marco  */
  /* ======================================================================== */

}
