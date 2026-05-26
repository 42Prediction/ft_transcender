import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
    private readonly bettorRepository: Repository<Bettor>
  ){}

  async create(user: User): Promise<Bettor> {
    if (!user){
      throw new InternalServerErrorException('User id required');
    }

    const avatar = createAvatar( avataaarsNeutral,{
      seed: user.email,
    } )
    const avatarUri = avatar.toDataUri();

    const emailPrefix = user.email.split('@')[0];
    const cleanPrefix = emailPrefix.substring(0, 20).replace(/[^a-zA-O0-9_.]/g, '');
    const temporaryNick = `${cleanPrefix}_${Math.floor(1000 + Math.random() * 9000)}`;
    const bettor: Bettor = this.bettorRepository.create({
      nick: temporaryNick,
      avatar: avatarUri,
      user: user,
    })
    return await this.bettorRepository.save(bettor);
  }

  findOne(id: number) {
    return `This action returns a #${id} bettor`;
  }

  async update(id: number, updateBettorDto: UpdateBettorDto) {
    return `This action updates a #${id} bettor`;
  }

  async findByNick(nick: string){

  }

}
