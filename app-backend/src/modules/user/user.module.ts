import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { BettorService } from '../bettor/bettor.service';
import { BettorModule } from '../bettor/bettor.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), BettorModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }
