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

}