import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateBettorDto } from './dto/update-bettor.dto';
import { User } from '../user/entities/user.entity';
import { Bettor } from './entities/bettor.entity';
import { createAvatar } from '@dicebear/core';
import { avataaarsNeutral } from '@dicebear/collection';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AvatarService } from './avatar.service';
import { Profile42Dto } from './dto/profile-42.dto';

@Injectable()
export class BettorService {
  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepository: Repository<Bettor>,
    private readonly avatarService: AvatarService,
  ) {}

  async create(user: User, dto?: Profile42Dto): Promise<Bettor> {
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
    let campus: string | undefined = undefined;
    if (dto) {
      campus = dto.campus ?? undefined;
    }
    const bettor: Bettor = this.bettorRepository.create({
      nick: temporaryNick,
      avatar: avatarUri,
      user: user,
      campus: campus,
    });
    return await this.bettorRepository.save(bettor);
  }

  async findOne(id: string ): Promise<Bettor | null>{
    return this.bettorRepository.findOne({
      where: { user: { id } },
      relations: ['user'],
    });
  }

  async findByNick(nick: string): Promise<Bettor> {
    const bettor = await this.bettorRepository.findOne({ where: { nick } });
    if (!bettor) throw new NotFoundException('Bettor not found');
    return bettor;
  }

  async update(userId: string,
    updateBettorDto: UpdateBettorDto, 
    avatarFile?:Express.Multer.File ) {
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
        throw new ConflictException('Nick already in use, choose another');
      bettor.isNickSetted = true;
    }
    if (avatarFile) {
      const oldFilename = this.avatarService.extractFilename(bettor.avatar);
      const filename = await this.avatarService.processAndSave(avatarFile);
      bettor.avatar = `${filename}`;
      this.avatarService.deleteOldAvatar(oldFilename);
    }
    if (updateBettorDto) Object.assign(bettor, updateBettorDto);
    return await this.bettorRepository.save(bettor);
  }
}
