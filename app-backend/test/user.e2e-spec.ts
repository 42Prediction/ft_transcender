import { Test, TestingModule } from '@nestjs/testing';
import 'reflect-metadata';
import { INestApplication, ExecutionContext, ClassSerializerInterceptor, UnauthorizedException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { Role } from '../src/shared/enums/roles.enum';
import { UserService } from '../src/modules/user/user.service';
import { UserController } from '../src/modules/user/user.controller';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/roles/roles.guard';

describe('UserController (E2E)', () => {
  let app: INestApplication;
  let userService: UserService;

  let currentActor: { id: string; role: Role } | null = {
    id: 'user-standard-id',
    role: Role.USER,
  };

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  class MockJwtAuthGuard {
    canActivate(context: ExecutionContext): boolean {
      if (!currentActor) throw new UnauthorizedException();
      
      const req = context.switchToHttp().getRequest();
      req.user = { id: currentActor.id, role: currentActor.role };
      return true;
    }
  }

  class MockRolesGuard {
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest();
      if (!req.user) return true;

      const roles = Reflect.getMetadata('roles', context.getHandler());
      if (!roles) return true;
      return roles.includes(currentActor ? currentActor.role : undefined);
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    await app.init();
    userService = moduleFixture.get<UserService>(UserService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security Boundaries (Guards Validation)', () => {
    it('should return 401 Unauthorized if the client has no JWT token', async () => {
      currentActor = null;

      await request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 Forbidden if a standard user tries to access admin routes', async () => {
      currentActor = { id: 'standard-id', role: Role.USER };

      await request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('Admin Endpoints', () => {
    beforeEach(() => {
      currentActor = { id: 'admin-id', role: Role.ADMIN };
    });

    it('POST /users -> should allow admin to create a new user', async () => {
      const payload = { email: 'newuser@test.com', password: 'password123' };
      const expectedOutput = { id: 'generated-uuid', email: 'newuser@test.com' };
      mockUserService.create.mockResolvedValue(expectedOutput);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(HttpStatus.OK);

      expect(userService.create).toHaveBeenCalledWith(payload);
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: expectedOutput,
        error: null,
      });
    });

    it('GET /users -> should allow admin to fetch all users', async () => {
      const expectedOutput = [{ id: '1', email: 'u1@test.com' }];
      mockUserService.findAll.mockResolvedValue(expectedOutput);

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.OK);

      expect(userService.findAll).toHaveBeenCalled();
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: expectedOutput,
        error: null,
      });
    });

    it('GET /users/:id -> should allow admin to fetch a specific user', async () => {
      const targetId = 'target-id';
      const expectedOutput = { id: targetId, email: 'target@test.com' };
      mockUserService.findOne.mockResolvedValue(expectedOutput);

      const response = await request(app.getHttpServer())
        .get(`/users/${targetId}`)
        .expect(HttpStatus.OK);

      expect(userService.findOne).toHaveBeenCalledWith(targetId);
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: expectedOutput,
        error: null,
      });
    });

    it('PATCH /users/:id -> should allow admin to update any user info', async () => {
      const targetId = 'any-user-id';
      const updatePayload = { email: 'admin-override@test.com' };
      const expectedOutput = { id: targetId, email: 'admin-override@test.com' };
      mockUserService.update.mockResolvedValue(expectedOutput);

      const response = await request(app.getHttpServer())
        .patch(`/users/${targetId}`)
        .send(updatePayload)
        .expect(HttpStatus.OK);

      expect(userService.update).toHaveBeenCalledWith(targetId, updatePayload);
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: expectedOutput,
        error: null,
      });
    });

    it('DELETE /users/:id -> should allow admin to destroy a user profile', async () => {
      const targetId = 'to-be-deleted';
      mockUserService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete(`/users/${targetId}`)
        .expect(HttpStatus.OK);

      expect(userService.remove).toHaveBeenCalledWith(targetId);
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: null,
        error: null,
      });
    });
  });

  describe('User Personal Endpoints ("me")', () => {
    beforeEach(() => {
      currentActor = { id: 'my-own-profile-id', role: Role.USER };
    });




    it('PATCH /users/me -> should update only the context user profile based on JWT payload', async () => {
      const updatePayload = { email: 'my-new-email@test.com' };
      const expectedOutput = { id: 'my-own-profile-id', email: 'my-new-email@test.com' };
      mockUserService.update.mockResolvedValue(expectedOutput);

      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .send(updatePayload)
        .expect(HttpStatus.OK);

      expect(userService.update).toHaveBeenCalledWith('my-own-profile-id', updatePayload);
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: expectedOutput,
        error: null,
      });
    });

    it('DELETE /users/me -> should delete the authenticated user profile own account', async () => {
      mockUserService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/users/me')
        .expect(HttpStatus.OK);

      expect(userService.remove).toHaveBeenCalledWith('my-own-profile-id');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: null,
        error: null,
      });
    });
  });
});