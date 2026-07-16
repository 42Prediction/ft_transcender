jest.mock('@dicebear/core', () => ({ createAvatar: jest.fn() }));
jest.mock('@dicebear/collection', () => ({ avataaarsNeutral: {} }));
jest.mock('uuid', () => ({ v4: () => 'uuid-mock' }));

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { BettorController } from './bettor.controller';
import { BettorService } from './bettor.service';
import { FriendService } from './friend.service';
import { UpdateBettorDto } from './dto/update-bettor.dto';

describe('BettorController', () => {
  let controller: BettorController;
  let bettorService: jest.Mocked<BettorService>;
  let friendService: jest.Mocked<FriendService>;

  const mockRequest = {
    user: { id: 'user-id-123' },
  };

  const mockBettorService = {
    findOne: jest.fn(),
    update: jest.fn(),
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
      controllers: [BettorController],
      providers: [
        { provide: BettorService, useValue: mockBettorService },
        { provide: FriendService, useValue: mockFriendService },
      ],
    }).compile();

    controller = module.get<BettorController>(BettorController);
    bettorService = module.get(BettorService);
    friendService = module.get(FriendService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMyProfile', () => {
    it('should return the logged-in user profile wrapped in successResponse', async () => {
      const userData = { id: 'user-id-123', name: 'John Doe' };
      bettorService.findOne.mockResolvedValue(userData as any);

      const result = await controller.findMyProfile(mockRequest);

      expect(bettorService.findOne).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(successResponse(userData));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.findMyProfile({ user: null });

      expect(bettorService.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(unauthorizedResponse());
    });

    it('should return errorResponse when service throws', async () => {
      const error = new Error('not found');
      bettorService.findOne.mockRejectedValue(error);

      const result = await controller.findMyProfile(mockRequest) as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe(error);
    });
  });

  describe('updateProfile', () => {
    it('should update profile with avatar file and return successResponse', async () => {
      const updateDto: UpdateBettorDto = { nick: 'new-nick' };
      const mockFile = { filename: 'avatar.png' } as Express.Multer.File;
      const updatedBettor = { id: 'user-id-123', nick: 'new-nick', avatar: 'avatar.png' };
      bettorService.update.mockResolvedValue(updatedBettor as any);

      const result = await controller.updateProfile(mockRequest, updateDto, mockFile);

      expect(bettorService.update).toHaveBeenCalledWith('user-id-123', updateDto, mockFile);
      expect(result).toEqual(successResponse(updatedBettor));
    });

    it('should update profile without avatar file (undefined branch)', async () => {
      const updateDto: UpdateBettorDto = { nick: 'only-nick' };
      const updatedBettor = { id: 'user-id-123', nick: 'only-nick' };
      bettorService.update.mockResolvedValue(updatedBettor as any);

      const result = await controller.updateProfile(mockRequest, updateDto, undefined);

      expect(bettorService.update).toHaveBeenCalledWith('user-id-123', updateDto, undefined);
      expect(result).toEqual(successResponse(updatedBettor));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.updateProfile({ user: null }, {}, undefined);

      expect(bettorService.update).not.toHaveBeenCalled();
      expect(result).toEqual(unauthorizedResponse());
    });

    it('should return errorResponse when service throws', async () => {
      const error = new Error('update failed');
      bettorService.update.mockRejectedValue(error);

      const result = await controller.updateProfile(mockRequest, {}, undefined) as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('checkNickExists', () => {
    it('Deve chamar o serviço com o parâmetro correto e retornar o formato { exists: true }', async () => {
      mockBettorService.nickExists.mockResolvedValueOnce(true);

      const result = await controller.checkNickExists('gildo');

      expect(mockBettorService.nickExists).toHaveBeenCalledWith('gildo');
      expect(result).toEqual({ exists: true });
    });

    it('Deve retornar { exists: false } quando o nickname não for encontrado no sistema', async () => {
      mockBettorService.nickExists.mockResolvedValueOnce(false);

      const result = await controller.checkNickExists('daniel_x');

      expect(mockBettorService.nickExists).toHaveBeenCalledWith('daniel_x');
      expect(result).toEqual({ exists: false });
    });
  });

  describe('publicProfile', () => {
    it('should return a public profile wrapped in successResponse', async () => {
      const bettor = { nick: 'lobo_pid' };
      bettorService.findByNick.mockResolvedValue(bettor as any);

      const result = await controller.publicProfile('lobo_pid');

      expect(bettorService.findByNick).toHaveBeenCalledWith('lobo_pid');
      expect(result).toEqual(successResponse(bettor));
    });

    it('should return errorResponse when service throws', async () => {
      const error = new Error('not found');
      bettorService.findByNick.mockRejectedValue(error);

      const result = await controller.publicProfile('unknown') as any;

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('getMyFriends', () => {
    it('should return the friend list wrapped in successResponse', async () => {
      const friends = [{ id: 'friend-1' }];
      friendService.getMyFriends.mockResolvedValue(friends as any);

      const result = await controller.getMyFriends(mockRequest);

      expect(friendService.getMyFriends).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(successResponse(friends));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.getMyFriends({ user: null });
      expect(result).toEqual(unauthorizedResponse());
    });
  });

  describe('getPublicFriends', () => {
    it('should return a public user friends list wrapped in successResponse', async () => {
      const friends = [{ id: 'friend-2' }];
      friendService.getPublicFriends.mockResolvedValue(friends as any);

      const result = await controller.getPublicFriends('some_nick');

      expect(friendService.getPublicFriends).toHaveBeenCalledWith('some_nick');
      expect(result).toEqual(successResponse(friends));
    });
  });

  describe('sendFriendRequest', () => {
    it('should call sendFriendRequest on service and return successResponse', async () => {
      const payload = { id: 'req-1' };
      friendService.sendFriendRequest.mockResolvedValue(payload as any);

      const result = await controller.sendFriendRequest(mockRequest, 'target_nick');

      expect(friendService.sendFriendRequest).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(successResponse(payload));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.sendFriendRequest({ user: null }, 'target_nick');
      expect(result).toEqual(unauthorizedResponse());
    });
  });

  describe('acceptFriendRequest', () => {
    it('should call acceptFriendRequest on service and return successResponse', async () => {
      const payload = { id: 'req-2' };
      friendService.acceptFriendRequest.mockResolvedValue(payload as any);

      const result = await controller.acceptFriendRequest(mockRequest, 'target_nick');

      expect(friendService.acceptFriendRequest).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(successResponse(payload));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.acceptFriendRequest({ user: null }, 'target_nick');
      expect(result).toEqual(unauthorizedResponse());
    });
  });

  describe('cancelRequest', () => {
    it('should call cancelFriendRequest on service and return successResponse', async () => {
      const payload = { id: 'req-3' };
      friendService.cancelFriendRequest.mockResolvedValue(payload as any);

      const result = await controller.cancelRequest(mockRequest, 'target_nick');

      expect(friendService.cancelFriendRequest).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(successResponse(payload));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.cancelRequest({ user: null }, 'target_nick');
      expect(result).toEqual(unauthorizedResponse());
    });
  });

  describe('rejectRequest', () => {
    it('should call rejectFriendRequest on service and return successResponse', async () => {
      const payload = { id: 'req-4' };
      friendService.rejectFriendRequest.mockResolvedValue(payload as any);

      const result = await controller.rejectRequest(mockRequest, 'target_nick');

      expect(friendService.rejectFriendRequest).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(successResponse(payload));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.rejectRequest({ user: null }, 'target_nick');
      expect(result).toEqual(unauthorizedResponse());
    });
  });

  describe('removeFriend', () => {
    it('should call removeFriend on service and return successResponse', async () => {
      const payload = { id: 'friend-1' };
      friendService.removeFriend.mockResolvedValue(payload as any);

      const result = await controller.removeFriend(mockRequest, 'target_nick');

      expect(friendService.removeFriend).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(successResponse(payload));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.removeFriend({ user: null }, 'target_nick');
      expect(result).toEqual(unauthorizedResponse());
    });
  });

  describe('getReceivedRequests', () => {
    it('should return received requests wrapped in successResponse', async () => {
      const requests = [{ id: 'req-1', status: 'PENDING', sender: { nick: 'gildo' } }];
      friendService.getReceivedRequests.mockResolvedValue(requests as any);

      const result = await controller.getReceivedRequests(mockRequest);

      expect(friendService.getReceivedRequests).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(successResponse(requests));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.getReceivedRequests({ user: null });
      expect(result).toEqual(unauthorizedResponse());
    });
  });

  describe('getSentRequests', () => {
    it('should return sent requests wrapped in successResponse', async () => {
      const requests = [{ id: 'req-2', status: 'PENDING', receiver: { nick: 'daniel' } }];
      friendService.getSentRequests.mockResolvedValue(requests as any);

      const result = await controller.getSentRequests(mockRequest);

      expect(friendService.getSentRequests).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(successResponse(requests));
    });

    it('should return unauthorizedResponse when user id is missing', async () => {
      const result = await controller.getSentRequests({ user: null });
      expect(result).toEqual(unauthorizedResponse());
    });
  });
});