import { Test, TestingModule } from '@nestjs/testing';
import { OptionalJwtAuthGuard } from '../src/modules/auth/guards/optional-jwt-auth.guard';
import { INestApplication, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { BettorController } from '../src/modules/bettor/bettor.controller';
import { BettorService } from '../src/modules/bettor/bettor.service';
import { FriendService } from '../src/modules/bettor/friend.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';


jest.mock('../src/config/multer.config', () => {
  const originalModule = jest.requireActual('../src/config/multer.config');
  return {
    ...originalModule,
    createAvatar: jest.fn().mockReturnValue('avatar_mockado.png'),
  };
});

describe('BettorController (E2E)', () => {
  let app: INestApplication;
  const mockBettorService = {
    findOne: jest.fn(),
    update: jest.fn(),
    findByNick: jest.fn(),
  };

  const mockFriendService = {
    getMyFriends: jest.fn(),
    getPublicFriends: jest.fn(),
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    cancelFriendRequest: jest.fn(),
    rejectFriendRequest: jest.fn(),
    removeFriend: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: 'user-id-123' };
      return true;
    },
  };

  const mockOptionalJwtAuthGuard = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: 'user-id-123' };
      return true;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BettorController],
      providers: [
        { provide: BettorService, useValue: mockBettorService },
        { provide: FriendService, useValue: mockFriendService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue(mockOptionalJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /bettor/me', () => {
    it('should return user profile', async () => {
      const mockProfile = { id: 'user-id-123', name: 'John Doe' };

      mockBettorService.findOne.mockResolvedValue(mockProfile);

      const response = await request(app.getHttpServer())
        .get('/bettor/me')
        .expect(200);

      expect(mockBettorService.findOne).toHaveBeenCalledWith('user-id-123');

      expect(response.body).toEqual({
        success: true,
        statusCode: 200,
        data: {
          id: 'user-id-123',
          name: 'John Doe',
        },
        error: null,
      });
    });
  });

  describe('PATCH /bettor/me', () => {
    it('should update profile sending a file and body data', async () => {
      const mockUpdatedProfile = { id: 'user-id-123', nick: 'novo_nick' };
      mockBettorService.update.mockResolvedValue(mockUpdatedProfile);

      const response = await request(app.getHttpServer())
        .patch('/bettor/me')
        .field('nick', 'novo_nick')
        .attach('avatar', Buffer.from('fake-image-content'), 'avatar.jpg')
        .expect(200);

      expect(mockBettorService.update).toHaveBeenCalled();
      expect(response.body).toEqual(mockUpdatedProfile);
    });

    it('should update profile successfully without sending a file (undefined branch)', async () => {
      const mockUpdatedProfile = { id: 'user-id-123', nick: 'apenas_nick' };
      mockBettorService.update.mockResolvedValue(mockUpdatedProfile);

      const response = await request(app.getHttpServer())
        .patch('/bettor/me')
        .send({ nick: 'apenas_nick' }) // Envia JSON comum, o avatar vira undefined
        .expect(200);

      expect(mockBettorService.update).toHaveBeenCalledWith('user-id-123', { nick: 'apenas_nick' }, undefined);
      expect(response.body).toEqual(mockUpdatedProfile);
    });
  });

  describe('GET /bettor/@:nick', () => {
    it('should return public profile by nick', async () => {
      const mockPublicProfile = { nick: 'alex_green' };
      mockBettorService.findByNick.mockResolvedValue(mockPublicProfile);

      const response = await request(app.getHttpServer())
        .get('/bettor/@alex_green')
        .expect(200);

      expect(mockBettorService.findByNick).toHaveBeenCalledWith('alex_green');
      expect(response.body).toEqual(mockPublicProfile);
    });
  });

  describe('GET /bettor/me/friends', () => {
    it('should return friends list of the logged user', async () => {
      const mockFriends = [{ id: 'friend-1' }];
      mockFriendService.getMyFriends.mockResolvedValue(mockFriends);

      const response = await request(app.getHttpServer())
        .get('/bettor/me/friends')
        .expect(200);

      expect(mockFriendService.getMyFriends).toHaveBeenCalledWith('user-id-123');
      expect(response.body).toEqual(mockFriends);
    });
  });

  describe('GET /bettor/@:nick/friends', () => {
    it('should return public friends list', async () => {
      const mockFriends = [{ id: 'friend-2' }];
      mockFriendService.getPublicFriends.mockResolvedValue(mockFriends);

      const response = await request(app.getHttpServer())
        .get('/bettor/@marcos/friends')
        .expect(200);

      expect(mockFriendService.getPublicFriends).toHaveBeenCalledWith('marcos');
      expect(response.body).toEqual(mockFriends);
    });
  });

  describe('POST /bettor/me/friend-requests/:nick/send', () => {
    it('should send a friend request', async () => {
      mockFriendService.sendFriendRequest.mockResolvedValue({ status: 'sent' });

      const response = await request(app.getHttpServer())
        .post('/bettor/me/friend-requests/lucas/send')
        .expect(201); // Post por padrão retorna 201 no NestJS

      expect(mockFriendService.sendFriendRequest).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({ status: 'sent' });
    });
  });

  describe('PATCH /bettor/me/friend-requests/:nick/accept', () => {
    it('should accept a friend request', async () => {
      mockFriendService.acceptFriendRequest.mockResolvedValue({ status: 'accepted' });

      const response = await request(app.getHttpServer())
        .patch('/bettor/me/friend-requests/lucas/accept')
        .expect(200);

      expect(mockFriendService.acceptFriendRequest).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({ status: 'accepted' });
    });
  });

  describe('DELETE /bettor/me/friend-requests/:nick/cancel', () => {
    it('should cancel a friend request', async () => {
      mockFriendService.cancelFriendRequest.mockResolvedValue({ status: 'cancelled' });

      const response = await request(app.getHttpServer())
        .delete('/bettor/me/friend-requests/lucas/cancel')
        .expect(200);

      expect(mockFriendService.cancelFriendRequest).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({ status: 'cancelled' });
    });
  });

  describe('DELETE /bettor/me/friend-requests/:nick/reject', () => {
    it('should reject a friend request', async () => {
      mockFriendService.rejectFriendRequest.mockResolvedValue({ status: 'rejected' });

      const response = await request(app.getHttpServer())
        .delete('/bettor/me/friend-requests/lucas/reject')
        .expect(200);

      expect(mockFriendService.rejectFriendRequest).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({ status: 'rejected' });
    });
  });

  describe('DELETE /bettor/me/friends/:nick', () => {
    it('should remove a friend', async () => {
      mockFriendService.removeFriend.mockResolvedValue({ status: 'removed' });

      const response = await request(app.getHttpServer())
        .delete('/bettor/me/friends/lucas')
        .expect(200);

      expect(mockFriendService.removeFriend).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({ status: 'removed' });
    });
  });
});
