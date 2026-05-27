import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  
  /*
  async getProfile(username: string): Promise<Omit<User, 'password'>> {
    const user = await this.findOne(username);
    const { password, ...result } = user;
    return result;
  }*/
  // Novo adicionado para lidar com id ou nome substituir o acima
  async getProfile(usernameOrId: string) {
    // Se for um número (ID), procura por ID. Se for string, procura por username.
    const isId = !isNaN(Number(usernameOrId));
    
    // CORREÇÃO AQUI: userRepository em vez de userRepo
    const user = await this.userRepository.findOne({
      where: isId ? { id: Number(usernameOrId) } : { username: usernameOrId }
    });

    if (!user) throw new NotFoundException('User não encontrado');

    // MANTEMOS A SEGURANÇA: omitimos a password da resposta
    const { password, ...result } = user;
    return result;
  }

  async setOffline(username: string): Promise<User> {
    const user = await this.findOne(username);
    user.is_online = true;
    return user;
  }

  async create(data: Partial<User>) {
    const username = data.username?.trim();
    const email = data.email?.trim().toLowerCase();

    if (!username || !email || !data.password) {
      throw new BadRequestException('username, email e password são obrigatórios');
    }

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('username já existe');
      }

      throw new ConflictException('email já existe');
    }

    const user = this.userRepository.create({
      ...data,
      username,
      email,
    });
    return this.userRepository.save(user);
  }
  
/*
  async getFriends(username: string): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['friends'],
    });
    if (!user){
      throw new NotFoundException ('User não encontrado');
    }
    return user.friends;
  }
*/
  // Novo
  async getFriends(usernameOrId: string) {
    // Tenta converter para número
    const id = Number(usernameOrId);
    const isNumeric = !isNaN(id);

    // CORREÇÃO AQUI: userRepository em vez de userRepo
    const user = await this.userRepository.findOne({
      where: isNumeric ? { id: id } : { username: usernameOrId },
      relations: ['friends']
    });

    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return user.friends;
  }

  async addFriend(username: string, friendUsername: string): Promise<User> {
    // 1. Encontra o utilizador atual (tu)
    const user = await this.userRepository.findOne({ 
      where: { username }, 
      relations: ['friends'] 
    });
    
    // 2. Encontra o amigo pelo USERNAME (e não pelo ID)
    const friend = await this.userRepository.findOne({ where: { username: friendUsername } });

    if (!user || !friend) throw new NotFoundException('Utilizador ou amigo não encontrado');
    if (user.username === friend.username) throw new BadRequestException('Não podes adicionar-te a ti mesmo');

    // Verifica se já são amigos
    const alreadyFriend = user.friends.find(f => f.id === friend.id);
    if (alreadyFriend) return user;

    user.friends.push(friend);
    return await this.userRepository.save(user);
  }

  async removeFriend(username: string, friendUsername: string): Promise<User> {
    // 1. Encontra o utilizador com a relação 'friends' carregada
    const user = await this.userRepository.findOne({ 
      where: { username }, 
      relations: ['friends'] 
    });
    
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    // 2. Remove o amigo da lista (filtra o array de amigos)
    user.friends = user.friends.filter(f => f.username !== friendUsername);

    // 3. Guarda o utilizador atualizado (o TypeORM tratará de remover a linha na tabela de ligação)
    return await this.userRepository.save(user);
  }

  // Temporario para testar o online e offline usando POST
  async updateStatus(username: string, is_online: boolean) {
    const user = await this.findOne(username);
    user.is_online = is_online;
    return await this.userRepository.save(user);
  }
}