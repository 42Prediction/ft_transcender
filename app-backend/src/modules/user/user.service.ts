import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt'
import { AdmUpdateUserDto } from './dto/admin-update-user.dto';
import { CreateOauthUserDto } from './create-oauth-user.dto';

@Injectable()
export class UserService {
  private SALTROUNDS: number = 10;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  async create(createUserDto: CreateUserDto | AdmUpdateUserDto): Promise<User> {
    const { email, password } = createUserDto;
    if (!password) {
      throw new BadRequestException('Password is required.');
    }
    const emailAlreadyExists: boolean = await this.userRepository.existsBy({ email });
    if (emailAlreadyExists) {
      throw new ConflictException('Email already exists.');
    }
    const hashed: string = await bcrypt.hash(password, this.SALTROUNDS);
    const user = this.userRepository.create({
      email,
      password: hashed,
    });
    return await this.userRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({where: { email }});
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user : User | null = await this.userRepository.findOne({
      where: { id },
    });
    if (!user){
      throw new NotFoundException("User Not Found");
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto | AdmUpdateUserDto): Promise<User> {
    const user : User | null = await this.userRepository.findOne({
      where: { id },
    });
    if (!user){
      throw new NotFoundException("User Not Found");
    }
    this.userRepository.merge(user, updateUserDto)
    return this.userRepository.save(user);
  };

  async remove(id: string) {
    const user = await this.userRepository.findOneBy({id});
    if (!user){
      throw new NotFoundException("User Not Found");
    }
    await this.userRepository.remove(user);
    return {
      message: 'User deleted successfully',
    }
  }

  createOauthUser(dto:CreateOauthUserDto ):Promise<User>{
    
    const user = this.userRepository.create({
        email:dto.email,
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
  /*
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
  */
}