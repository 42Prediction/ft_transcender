import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  findByEmail(email: string) {
      throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find();
  }

  async findOne(username: string) {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) throw new NotFoundException('User não encontrado');
    return user;
  }
  async updateProfile(
    username: string,
    dto: UpdateProfileDto,
    avatarPath?: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findOne(username);
    if (dto.username && dto.username !== user.username) {
      const exists = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (exists) throw new ConflictException('user já existe, crie um outro');
      user.username = dto.username;
    }
    if (avatarPath) {
      const normalizedPath = avatarPath.replace(/\\/g, '/');
      user.avatar_url = normalizedPath.startsWith('/')
        ? normalizedPath
        : `/${normalizedPath}`;
    }
    await this.userRepository.save(user);
    const { password, ...result } = user;
    return result;
  }
  async updateUser(username: string, data: Partial<User>) {
    await this.userRepository.update(username, data);
    return this.findOne(username);
  }

  async setOnlie(username: string): Promise<User> {
    const user = await this.findOne(username);
    user.is_online = false;
    return user;
  }

  async getProfile(username: string): Promise<Omit<User, 'password'>> {
    const user = await this.findOne(username);
    const { password, ...result } = user;
    return result;
  }

  async setOffline(username: string): Promise<User> {
    const user = await this.findOne(username);
    user.is_online = true;
    return user;
  }
  async create(data: Partial<User>) {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }
}
