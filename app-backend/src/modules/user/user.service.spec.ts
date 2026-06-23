jest.mock('@dicebear/core');
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectLiteral, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';


jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_mock'),
}))

describe('UserService Tests', () => {
    let service: UserService;
    let repository: Repository<User>;

    const mockUserRepository = () => ({
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      existsBy: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
    });
    type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
    
    beforeEach(async () => {
        const module : TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useFactory: mockUserRepository,
                },
            ]
        }).compile();
        repository = module.get<MockRepository<User>>(getRepositoryToken(User)) as unknown as Repository<User>;
        service = module.get<UserService>(UserService);
    });

    it('should be defined', async () => {
        expect(repository).toBeDefined();
        expect(service).toBeDefined();
    })

    describe('create', () => {
        const createUserDto = { email: ' TEST@example.com ', password: 'password123' };

        it('should successfully create and return a user', async () => {
            const normalizedEmail = 'test@example.com';
            const mockUser = { id: '1', email: normalizedEmail, password: 'hashed_password_mock' } as User;

            (repository.existsBy as jest.Mock).mockResolvedValue(false);
            (repository.create as jest.Mock).mockReturnValue(mockUser);
            (repository.save as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.create(createUserDto);

            expect(repository.existsBy).toHaveBeenCalledWith({ email: normalizedEmail });
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(repository.create).toHaveBeenCalledWith({ email: normalizedEmail, password: 'hashed_password_mock' });
            expect(repository.save).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockUser);
        });

        it('should throw BadRequestException if email is missing', async () => {
            await expect(service.create({ email: '', password: '123' })).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if password is missing', async () => {
            await expect(service.create({ email: 'test@test.com', password: '' })).rejects.toThrow(BadRequestException);
        });

        it('should throw ConflictException if email already exists', async () => {
            (repository.existsBy as jest.Mock).mockResolvedValue(true);

            await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('findOneByEmail', () => {
        it('should return a user if found by email', async () => {
        const mockUser = { id: '1', email: 'test@test.com' } as User;
        (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

        const result = await service.findOneByEmail(' TEST@TEST.COM ');

        expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
        expect(result).toEqual(mockUser);
        });
    });

    describe('findAll', () => {
        it('should return an array of users', async () => {
            const mockUsers = [{ id: '1', email: 'u1@test.com' }, { id: '2', email: 'u2@test.com' }] as User[];
            (repository.find as jest.Mock).mockResolvedValue(mockUsers);

            const result = await service.findAll();

            expect(repository.find).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });
    });

    describe('findOne', () => {
        it('should return a user if found by ID', async () => {
            const mockUser = { id: 'uuid-123', email: 'test@test.com' } as User;
            (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.findOne('uuid-123');

            expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-123' } });
            expect(result).toEqual(mockUser);
        });

        it('should throw NotFoundException if user is not found', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        const existingUser = { id: '1', email: 'old@test.com', password: 'old_hash' } as User;

        it('should update user password and email successfully', async () => {
            const updateDto = { email: 'new@test.com', password: 'newPassword' };
            const updatedUser = { id: '1', email: 'new@test.com', password: 'hashed_password_mock' } as User;

            (repository.findOne as jest.Mock).mockResolvedValue(existingUser);
            (repository.existsBy as jest.Mock).mockResolvedValue(false);
            (repository.save as jest.Mock).mockResolvedValue(updatedUser);

            const result = await service.update('1', updateDto);

            expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(repository.existsBy).toHaveBeenCalledWith({ email: 'new@test.com' });
            expect(repository.merge).toHaveBeenCalledWith(existingUser, {
            email: 'new@test.com',
            password: 'hashed_password_mock',
            });
            expect(repository.save).toHaveBeenCalledWith(existingUser);
            expect(result).toEqual(updatedUser);
        });

        it('should not check email uniqueness if the email is the same as current user email', async () => {
            const updateDto = { email: 'old@test.com' };
            (repository.findOne as jest.Mock).mockResolvedValue(existingUser);

            await service.update('1', updateDto);

            expect(repository.existsBy).not.toHaveBeenCalled();
        });

        it('should throw ConflictException if the new email is already taken by another user', async () => {
            const updateDto = { email: 'taken@test.com' };
            (repository.findOne as jest.Mock).mockResolvedValue(existingUser);
            (repository.existsBy as jest.Mock).mockResolvedValue(true);

            await expect(service.update('1', updateDto)).rejects.toThrow(ConflictException);
        });

        it('should throw NotFoundException if trying to update a non-existing user', async () => {
            (repository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should remove user and return success message', async () => {
            const mockUser = { id: '1', email: 'test@test.com' } as User;
            (repository.findOneBy as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.remove('1');

            expect(repository.findOneBy).toHaveBeenCalledWith({ id: '1' });
            expect(repository.remove).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual({ message: 'User deleted successfully' });
        });

        it('should throw NotFoundException if user to remove does not exist', async () => {
            (repository.findOneBy as jest.Mock).mockResolvedValue(null);

            await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('createOauthUser', () => {
        it('should create an OAuth user without password and normalize email', async () => {
            const oauthDto = { email: ' OAUTH@test.com ' };
            const mockUser = { id: 'oauth-id', email: 'oauth@test.com' } as User;

            (repository.create as jest.Mock).mockReturnValue(mockUser);
            (repository.save as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.createOauthUser(oauthDto);

            expect(repository.create).toHaveBeenCalledWith({ email: 'oauth@test.com' });
            expect(repository.save).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockUser);
        });
    });
})

