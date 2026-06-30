import { Test, TestingModule } from '@nestjs/testing';
import { OptionalJwtAuthGuard } from '../src/modules/auth/guards/optional-jwt-auth.guard';
import { INestApplication, ClassSerializerInterceptor, HttpStatus } from '@nestjs/common';
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
    getReceivedRequests: jest.fn(),
    getSentRequests: jest.fn(),
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
        .expect(HttpStatus.OK);

      expect(mockBettorService.findOne).toHaveBeenCalledWith('user-id-123');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockProfile,
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
        .expect(HttpStatus.OK);

      expect(mockBettorService.update).toHaveBeenCalled();
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockUpdatedProfile,
        error: null,
      });
    });

    it('should update profile successfully without sending a file (undefined branch)', async () => {
      const mockUpdatedProfile = { id: 'user-id-123', nick: 'apenas_nick' };
      mockBettorService.update.mockResolvedValue(mockUpdatedProfile);

      const response = await request(app.getHttpServer())
        .patch('/bettor/me')
        .send({ nick: 'apenas_nick' })
        .expect(HttpStatus.OK);

      expect(mockBettorService.update).toHaveBeenCalledWith('user-id-123', { nick: 'apenas_nick' }, undefined);
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockUpdatedProfile,
        error: null,
      });
    });
  });

  describe('GET /bettor/@:nick', () => {
    it('should return public profile by nick', async () => {
      const mockPublicProfile = { nick: 'alex_green' };
      mockBettorService.findByNick.mockResolvedValue(mockPublicProfile);

      const response = await request(app.getHttpServer())
        .get('/bettor/@alex_green')
        .expect(HttpStatus.OK);

      expect(mockBettorService.findByNick).toHaveBeenCalledWith('alex_green');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockPublicProfile,
        error: null,
      });
    });
  });

  describe('GET /bettor/me/friends', () => {
    it('should return friends list of the logged user', async () => {
      const mockFriends = [{ id: 'friend-1' }];
      mockFriendService.getMyFriends.mockResolvedValue(mockFriends);

      const response = await request(app.getHttpServer())
        .get('/bettor/me/friends')
        .expect(HttpStatus.OK);

      expect(mockFriendService.getMyFriends).toHaveBeenCalledWith('user-id-123');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockFriends,
        error: null,
      });
    });
  });

  describe('GET /bettor/@:nick/friends', () => {
    it('should return public friends list', async () => {
      const mockFriends = [{ id: 'friend-2' }];
      mockFriendService.getPublicFriends.mockResolvedValue(mockFriends);

      const response = await request(app.getHttpServer())
        .get('/bettor/@marcos/friends')
        .expect(HttpStatus.OK);

      expect(mockFriendService.getPublicFriends).toHaveBeenCalledWith('marcos');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockFriends,
        error: null,
      });
    });
  });

  describe('POST /bettor/me/friend-requests/:nick/send', () => {
    it('should send a friend request', async () => {
      const mockResult = { status: 'sent' };
      mockFriendService.sendFriendRequest.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .post('/bettor/me/friend-requests/lucas/send')
        .expect(HttpStatus.OK);

      expect(mockFriendService.sendFriendRequest).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockResult,
        error: null,
      });
    });
  });

  describe('PATCH /bettor/me/friend-requests/:nick/accept', () => {
    it('should accept a friend request', async () => {
      const mockResult = { status: 'accepted' };
      mockFriendService.acceptFriendRequest.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .patch('/bettor/me/friend-requests/lucas/accept')
        .expect(HttpStatus.OK);

      expect(mockFriendService.acceptFriendRequest).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockResult,
        error: null,
      });
    });
  });

  describe('DELETE /bettor/me/friend-requests/:nick/cancel', () => {
    it('should cancel a friend request', async () => {
      const mockResult = { status: 'cancelled' };
      mockFriendService.cancelFriendRequest.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .delete('/bettor/me/friend-requests/lucas/cancel')
        .expect(HttpStatus.OK);

      expect(mockFriendService.cancelFriendRequest).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockResult,
        error: null,
      });
    });
  });

  describe('DELETE /bettor/me/friend-requests/:nick/reject', () => {
    it('should reject a friend request', async () => {
      const mockResult = { status: 'rejected' };
      mockFriendService.rejectFriendRequest.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .delete('/bettor/me/friend-requests/lucas/reject')
        .expect(HttpStatus.OK);

      expect(mockFriendService.rejectFriendRequest).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockResult,
        error: null,
      });
    });
  });

  describe('DELETE /bettor/me/friends/:nick', () => {
    it('should remove a friend', async () => {
      const mockResult = { status: 'removed' };
      mockFriendService.removeFriend.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .delete('/bettor/me/friends/lucas')
        .expect(HttpStatus.OK);

      expect(mockFriendService.removeFriend).toHaveBeenCalledWith('user-id-123', 'lucas');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockResult,
        error: null,
      });
    });
  });

  describe('GET /bettor/me/friend-requests/received', () => {
    it('should return received friend requests', async () => {
      const mockRequests = [{ id: 'request-received-1' }];
      mockFriendService.getReceivedRequests.mockResolvedValue(mockRequests);

      const response = await request(app.getHttpServer())
        .get('/bettor/me/friend-requests/received')
        .expect(HttpStatus.OK);

      expect(mockFriendService.getReceivedRequests).toHaveBeenCalledWith('user-id-123');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockRequests,
        error: null,
      });
    });
  });

  describe('GET /bettor/me/friend-requests/sent', () => {
    it('should return sent friend requests', async () => {
      const mockRequests = [{ id: 'request-sent-1' }];
      mockFriendService.getSentRequests.mockResolvedValue(mockRequests);

      const response = await request(app.getHttpServer())
        .get('/bettor/me/friend-requests/sent')
        .expect(HttpStatus.OK);

      expect(mockFriendService.getSentRequests).toHaveBeenCalledWith('user-id-123');
      expect(response.body).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockRequests,
        error: null,
      });
    });
  });
});