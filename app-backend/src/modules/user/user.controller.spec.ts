import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AdmUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

describe('UserController', () => {
    let controller: UserController;
    let service: UserService;

    const mockUserService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
            {
                provide: UserService,
                useValue: mockUserService,
            },
            ],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

        controller = module.get<UserController>(UserController);
        service = module.get<UserService>(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
    expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should call service.create with correct payload', async () => {
            const dto: AdmUpdateUserDto = { email: 'admin@test.com', password: 'securePassword123' };
            const expectedResult = { id: 'uuid-1', email: 'admin@test.com' } as User;

            mockUserService.create.mockResolvedValue(expectedResult);

            const result = await controller.create(dto);

            expect(service.create).toHaveBeenCalledWith(dto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('findAll', () => {
        it('should return an array of users from service', async () => {
            const expectedResult = [{ id: '1', email: 'user1@test.com' }] as User[];
            mockUserService.findAll.mockResolvedValue(expectedResult);

            const result = await controller.findAll();

            expect(service.findAll).toHaveBeenCalled();
            expect(result).toEqual(expectedResult);
        });
    });

    describe('findOne', () => {
        it('should call service.findOne with route parameter id', async () => {
            const id = 'uuid-123';
            const expectedResult = { id, email: 'user@test.com' } as User;
            mockUserService.findOne.mockResolvedValue(expectedResult);

            const result = await controller.findOne(id);

            expect(service.findOne).toHaveBeenCalledWith(id);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('updateMe', () => {
        it('should update the authenticated user based on request object context', async () => {
            const mockReq = { user: { id: 'my-authenticated-id' } };
            const dto: UpdateUserDto = { email: 'new-email@test.com' };
            const expectedResult = { id: 'my-authenticated-id', email: 'new-email@test.com' } as User;

            mockUserService.update.mockResolvedValue(expectedResult);

            const result = await controller.updateMe(mockReq, dto);

            expect(service.update).toHaveBeenCalledWith('my-authenticated-id', dto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('remove', () => {
        it('should delete the authenticated user using req.user.id', async () => {
            const mockReq = { user: { id: 'delete-my-account-id' } };
            const expectedResult = { message: 'User deleted successfully' };

            mockUserService.remove.mockResolvedValue(expectedResult);

            const result = await controller.remove(mockReq);

            expect(service.remove).toHaveBeenCalledWith('delete-my-account-id');
            expect(result).toEqual(expectedResult);
        });
    });

    describe('admUpdate', () => {
        it('should allow admin to update any user by specifying an ID', async () => {
            const id = 'target-user-id';
            const dto: AdmUpdateUserDto = { email: 'forced-change@test.com' };
            const expectedResult = { id, email: 'forced-change@test.com' } as User;

            mockUserService.update.mockResolvedValue(expectedResult);

            const result = await controller.admUpdate(id, dto);

            expect(service.update).toHaveBeenCalledWith(id, dto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('admRemove', () => {
        it('should allow admin to delete any user by specifying an ID', async () => {
            const id = 'target-user-to-delete';
            const expectedResult = { message: 'User deleted successfully' };

            mockUserService.remove.mockResolvedValue(expectedResult);

            const result = await controller.admRemove(id);

            expect(service.remove).toHaveBeenCalledWith(id);
            expect(result).toEqual(expectedResult);
        });
    });
});
