import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
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

  const successResponse = <T>(data: T) => ({
    success: true,
    statusCode: HttpStatus.OK,
    data,
    error: null,
  });

  const unauthorizedResponse = () => ({
    success: false,
    statusCode: HttpStatus.UNAUTHORIZED,
    data: null,
    error: 'Unauthorized',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
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

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should return successResponse with created user', async () => {
      const dto: AdmUpdateUserDto = { email: 'admin@test.com', password: 'securePassword123' };
      const user = { id: 'uuid-1', email: 'admin@test.com' } as User;
      mockUserService.create.mockResolvedValue(user);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(successResponse(user));
    });

    it('should return errorResponse when service throws', async () => {
      const error = new Error('creation failed');
      mockUserService.create.mockRejectedValue(error);

      const result = await controller.create({}) as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe(error);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return successResponse with array of users', async () => {
      const users = [{ id: '1', email: 'user1@test.com' }] as User[];
      mockUserService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(successResponse(users));
    });

    it('should return errorResponse when service throws', async () => {
      mockUserService.findAll.mockRejectedValue(new Error('db error'));

      const result = await controller.findAll() as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return successResponse with found user', async () => {
      const id = 'uuid-123';
      const user = { id, email: 'user@test.com' } as User;
      mockUserService.findOne.mockResolvedValue(user);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(successResponse(user));
    });

    it('should return errorResponse when service throws', async () => {
      mockUserService.findOne.mockRejectedValue(new Error('not found'));

      const result = await controller.findOne('bad-id') as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  // ─── getMe ────────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('should return successResponse with the authenticated user', async () => {
      const mockReq = { user: { id: 'my-id' } };
      const user = { id: 'my-id', email: 'me@test.com' } as User;
      mockUserService.findOne.mockResolvedValue(user);

      const result = await controller.getMe(mockReq);

      expect(service.findOne).toHaveBeenCalledWith('my-id');
      expect(result).toEqual(successResponse(user));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.getMe({ user: null });

      expect(service.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(unauthorizedResponse());
    });

    it('should return errorResponse when service throws', async () => {
      mockUserService.findOne.mockRejectedValue(new Error('not found'));

      const result = await controller.getMe({ user: { id: 'my-id' } }) as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  // ─── updateMe ─────────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('should return successResponse with updated user', async () => {
      const mockReq = { user: { id: 'my-authenticated-id' } };
      const dto: UpdateUserDto = { email: 'new-email@test.com' };
      const user = { id: 'my-authenticated-id', email: 'new-email@test.com' } as User;
      mockUserService.update.mockResolvedValue(user);

      const result = await controller.updateMe(mockReq, dto);

      expect(service.update).toHaveBeenCalledWith('my-authenticated-id', dto);
      expect(result).toEqual(successResponse(user));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.updateMe({ user: null }, {});

      expect(service.update).not.toHaveBeenCalled();
      expect(result).toEqual(unauthorizedResponse());
    });

    it('should return errorResponse when service throws', async () => {
      mockUserService.update.mockRejectedValue(new Error('update failed'));

      const result = await controller.updateMe({ user: { id: 'my-id' } }, {}) as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  // ─── remove (me) ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should return successResponse with null data after deletion', async () => {
      const mockReq = { user: { id: 'delete-my-account-id' } };
      mockUserService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockReq);

      expect(service.remove).toHaveBeenCalledWith('delete-my-account-id');
      expect(result).toEqual(successResponse(null));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.remove({ user: null });

      expect(service.remove).not.toHaveBeenCalled();
      expect(result).toEqual(unauthorizedResponse());
    });

    it('should return errorResponse when service throws', async () => {
      mockUserService.remove.mockRejectedValue(new Error('delete failed'));

      const result = await controller.remove({ user: { id: 'my-id' } }) as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  // ─── admUpdate ────────────────────────────────────────────────────────────────

  describe('admUpdate', () => {
    it('should return successResponse with updated user', async () => {
      const id = 'target-user-id';
      const dto: AdmUpdateUserDto = { email: 'forced-change@test.com' };
      const user = { id, email: 'forced-change@test.com' } as User;
      mockUserService.update.mockResolvedValue(user);

      const result = await controller.admUpdate(id, dto);

      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(successResponse(user));
    });

    it('should return errorResponse when service throws', async () => {
      mockUserService.update.mockRejectedValue(new Error('update failed'));

      const result = await controller.admUpdate('id', {}) as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  // ─── admRemove ────────────────────────────────────────────────────────────────

  describe('admRemove', () => {
    it('should return successResponse with null data after deletion', async () => {
      const id = 'target-user-to-delete';
      mockUserService.remove.mockResolvedValue(undefined);

      const result = await controller.admRemove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(successResponse(null));
    });

    it('should return errorResponse when service throws', async () => {
      mockUserService.remove.mockRejectedValue(new Error('delete failed'));

      const result = await controller.admRemove('id') as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });
});