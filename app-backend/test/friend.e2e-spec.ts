import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BettorController } from '../src/modules/bettor/bettor.controller';
import { BettorService } from '../src/modules/bettor/bettor.service';
import { FriendService } from '../src/modules/bettor/friend.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import request from 'supertest';

jest.mock('../src/config/multer.config', () => {
  const originalModule = jest.requireActual('../src/config/multer.config');
  return {
    ...originalModule,
    createAvatar: jest.fn().mockReturnValue('avatar_mockado.png'),
  };
});

describe('FriendController via BettorController (E2E)', () => {
  let app: INestApplication;

  const mockBettorService = {
    findOne: jest.fn(),
    findByNick: jest.fn(),
    nickExists: jest.fn(),
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
      if (req.headers['x-bypass-auth'] === 'false') {
        return false;
      }
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

  describe('Security and Auth Guard', () => {
    it('Should block unauthorized requests to protected friend routes', async () => {
      await request(app.getHttpServer())
        .get('/bettor/me/friends')
        .set('x-bypass-auth', 'false')
        .expect(403);
    });
  });

  describe('E2E - Nickname Existence Check', () => {
    it('GET /bettor/@gildo/exists -> Deve responder com 200 OK e o payload adequado', async () => {
      mockBettorService.nickExists.mockResolvedValueOnce(true);

      const response = await request(app.getHttpServer())
        .get('/bettor/@gildo/exists')
        .expect(200);

      expect(response.body).toEqual({ exists: true });
    });
  });

  describe('Friend Lists', () => {
    it('GET /bettor/me/friends -> should return private friends list', async () => {
      const mockResult = [{ id: '1', nick: 'gildo' }];
      mockFriendService.getMyFriends.mockResolvedValue(mockResult);

      const res = await request(app.getHttpServer())
        .get('/bettor/me/friends')
        .expect(200);

      expect(mockFriendService.getMyFriends).toHaveBeenCalledWith('user-id-123');
      expect(res.body).toEqual(mockResult);
    });

    it('GET /bettor/@:nick/friends -> should return public friends list', async () => {
      const mockResult = [{ id: '2', nick: 'daniel' }];
      mockFriendService.getPublicFriends.mockResolvedValue(mockResult);

      const res = await request(app.getHttpServer())
        .get('/bettor/@daniel/friends')
        .expect(200);

      expect(mockFriendService.getPublicFriends).toHaveBeenCalledWith('daniel');
      expect(res.body).toEqual(mockResult);
    });
  });

  describe('Friend Requests Cycle', () => {
    it('POST /bettor/me/friend-requests/:nick/send -> should send a request', async () => {
      mockFriendService.sendFriendRequest.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/bettor/me/friend-requests/gildo/send')
        .expect(201);

      expect(mockFriendService.sendFriendRequest).toHaveBeenCalledWith('user-id-123', 'gildo');
    });

    it('PATCH /bettor/me/friend-requests/:nick/accept -> should accept a request', async () => {
      mockFriendService.acceptFriendRequest.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .patch('/bettor/me/friend-requests/gildo/accept')
        .expect(200);

      expect(mockFriendService.acceptFriendRequest).toHaveBeenCalledWith('user-id-123', 'gildo');
    });

    it('DELETE /bettor/me/friend-requests/:nick/reject -> should reject a request', async () => {
      mockFriendService.rejectFriendRequest.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/bettor/me/friend-requests/gildo/reject')
        .expect(200);

      expect(mockFriendService.rejectFriendRequest).toHaveBeenCalledWith('user-id-123', 'gildo');
    });

    it('DELETE /bettor/me/friend-requests/:nick/cancel -> should cancel a pending request', async () => {
      mockFriendService.cancelFriendRequest.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/bettor/me/friend-requests/gildo/cancel')
        .expect(200);

      expect(mockFriendService.cancelFriendRequest).toHaveBeenCalledWith('user-id-123', 'gildo');
    });
  });

  describe('Manage Existing Friends', () => {
    it('DELETE /bettor/me/friends/:nick -> should remove an existing friend', async () => {
      mockFriendService.removeFriend.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/bettor/me/friends/gildo')
        .expect(200);

      expect(mockFriendService.removeFriend).toHaveBeenCalledWith('user-id-123', 'gildo');
    });
  });

  describe('Listing Pending Requests', () => {
    it('GET /bettor/me/friend-requests/received -> should return incoming requests', async () => {
      const mockResult = [{ id: 'req1', status: 'PENDING' }];
      mockFriendService.getReceivedRequests.mockResolvedValue(mockResult);

      const res = await request(app.getHttpServer())
        .get('/bettor/me/friend-requests/received')
        .expect(200);

      expect(mockFriendService.getReceivedRequests).toHaveBeenCalledWith('user-id-123');
      expect(res.body).toEqual(mockResult);
    });

    it('GET /bettor/me/friend-requests/sent -> should return outgoing requests', async () => {
      const mockResult = [{ id: 'req2', status: 'PENDING' }];
      mockFriendService.getSentRequests.mockResolvedValue(mockResult);

      const res = await request(app.getHttpServer())
        .get('/bettor/me/friend-requests/sent')
        .expect(200);

      expect(mockFriendService.getSentRequests).toHaveBeenCalledWith('user-id-123');
      expect(res.body).toEqual(mockResult);
    });
  });
});