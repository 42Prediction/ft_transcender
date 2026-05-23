import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
  private SALTROUNDS: number = 10;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;
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
    return await this.userRepository.findOneBy({ email });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['bettor'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
