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
import { ADMIN_TREASURY_BALANCE, WalletService } from '../wallet/wallet.service';
import { Profile42Dto } from './dto/profile-42.dto';
import { Role } from '../../shared/enums/roles.enum';

@Injectable()
export class BettorService {
  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepository: Repository<Bettor>,
    private readonly avatarService: AvatarService,
    private readonly walletService: WalletService
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
    const bettorSaved =  await this.bettorRepository.save(bettor);
    // The admin is the house — it seeds every market and needs a treasury, not
    // the regular new-user bonus.
    if (user.role === Role.ADMIN) {
      await this.walletService.createWallet(
        bettorSaved.id,
        ADMIN_TREASURY_BALANCE,
        'Admin treasury',
      );
    } else {
      await this.walletService.createWallet(bettorSaved.id);
    }
    return bettorSaved;
  }

  async findOne(id: string ): Promise<Bettor | null>{
    return this.bettorRepository.findOne({
      where: { user: { id } },
      relations: ['user', 'wallet'],
    });
  }

  async findByNick(nick: string): Promise<Bettor> {
    const bettor = await this.bettorRepository.findOne({ where: { nick } });
    if (!bettor) throw new NotFoundException('Bettor not found');
    return bettor;
  }

  async nickExists(nick: string): Promise<boolean> {
    const count = await this.bettorRepository.count({ where: { nick } });
    return count > 0;
  }

  async searchByNick(q: string, limit = 8, excludeUserId?: string) {
    const query = q.trim();
    if (query.length < 2) return [];
    const qb = this.bettorRepository
      .createQueryBuilder('b')
      .where('b.nick ILIKE :like', { like: `%${query}%` });
    if (excludeUserId) {
      qb.andWhere('b.user_id != :excludeUserId', { excludeUserId });
    }
    const bettors = await qb.orderBy('b.nick', 'ASC').limit(limit).getMany();
    return bettors.map((b) => ({
      id: b.id,
      nick: b.nick,
      avatar: b.avatar ?? null,
      campus: b.campus ?? null,
    }));
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
