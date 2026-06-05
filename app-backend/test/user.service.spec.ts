import {Test, TestingModule} from "@nestjs/testing"
import { expect } from "@jest/globals"
import { UserService } from "../src/modules/user/user.service"
import { Repository } from "typeorm"
import { User } from "../src/modules/user/entities/user.entity"
import { getRepositoryToken } from "@nestjs/typeorm"


describe('UserService Tests', () => {
    let userService: UserService;
    let userRepository: Repository<User>;

    beforeEach(async () => {
        const module : TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {

                    }
                },
            ]
        }).compile();
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', async () => {
        expect(userRepository).toBeDefined();
        expect(userService).toBeDefined();
    })
})