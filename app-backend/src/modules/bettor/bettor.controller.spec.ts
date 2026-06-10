// Mock dependências ESM que causam erro no Jest
jest.mock('@dicebear/core', () => ({ createAvatar: jest.fn() }));
jest.mock('@dicebear/collection', () => ({ avataaarsNeutral: {} }));
jest.mock('uuid', () => ({ v4: () => 'uuid-mock' }));

import { Test, TestingModule } from '@nestjs/testing';
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

  // Mocks dos Serviços
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
    it('should return the logged-in user profile', async () => {
      const expectedResult = { id: 'user-id-123', name: 'John Doe' };
      bettorService.findOne.mockResolvedValue(expectedResult as any);

      const result = await controller.findMyProfile(mockRequest);

      expect(bettorService.findOne).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateProfile', () => {
    it('should update profile with a file (avatar) and dto data', async () => {
      const updateDto: UpdateBettorDto = { nick: 'new-nick' };
      const mockFile = { filename: 'avatar.png' } as Express.Multer.File;
      const expectedResult = { id: 'user-id-123', nick: 'new-nick', avatar: 'avatar.png' };

      bettorService.update.mockResolvedValue(expectedResult as any);

      const result = await controller.updateProfile(mockRequest, updateDto, mockFile);

      expect(bettorService.update).toHaveBeenCalledWith('user-id-123', updateDto, mockFile);
      expect(result).toEqual(expectedResult);
    });

    it('should update profile successfully even when avatar file is branch undefined', async () => {
      const updateDto: UpdateBettorDto = { nick: 'only-nick' };
      const expectedResult = { id: 'user-id-123', nick: 'only-nick' };

      bettorService.update.mockResolvedValue(expectedResult as any);

      // Cobrindo o branch opcional do avatarFile (avatarFile?: Express.Multer.File)
      const result = await controller.updateProfile(mockRequest, updateDto, undefined);

      expect(bettorService.update).toHaveBeenCalledWith('user-id-123', updateDto, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('publicProfile', () => {
    it('should return a profile by nickname', async () => {
      const expectedResult = { nick: 'lobo_pid' };
      bettorService.findByNick.mockResolvedValue(expectedResult as any);

      const result = await controller.publicProfile('lobo_pid');

      expect(bettorService.findByNick).toHaveBeenCalledWith('lobo_pid');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMyFriends', () => {
    it('should return friends list of logged user', async () => {
      const expectedFriends = [{ id: 'friend-1' }];
      friendService.getMyFriends.mockResolvedValue(expectedFriends as any);

      const result = await controller.getMyFriends(mockRequest);

      expect(friendService.getMyFriends).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(expectedFriends);
    });
  });

  describe('getPublicFriends', () => {
    it('should return friends list of a public user by nick', async () => {
      const expectedFriends = [{ id: 'friend-2' }];
      friendService.getPublicFriends.mockResolvedValue(expectedFriends as any);

      const result = await controller.getPublicFriends('some_nick');

      expect(friendService.getPublicFriends).toHaveBeenCalledWith('some_nick');
      expect(result).toEqual(expectedFriends);
    });
  });

  describe('sendFriendRequest', () => {
    it('should call sendFriendRequest on service', async () => {
      const expectedResponse = { success: true };
      friendService.sendFriendRequest.mockResolvedValue(expectedResponse as any);

      const result = await controller.sendFriendRequest(mockRequest, 'target_nick');

      expect(friendService.sendFriendRequest).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('acceptFriendRequest', () => {
    it('should call acceptFriendRequest on service', async () => {
      const expectedResponse = { success: true };
      friendService.acceptFriendRequest.mockResolvedValue(expectedResponse as any);

      const result = await controller.acceptFriendRequest(mockRequest, 'target_nick');

      expect(friendService.acceptFriendRequest).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('cancelRequest', () => {
    it('should call cancelFriendRequest on service', async () => {
      const expectedResponse = { success: true };
      friendService.cancelFriendRequest.mockResolvedValue(expectedResponse as any);

      const result = await controller.cancelRequest(mockRequest, 'target_nick');

      expect(friendService.cancelFriendRequest).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('rejectRequest', () => {
    it('should call rejectFriendRequest on service', async () => {
      const expectedResponse = { success: true };
      friendService.rejectFriendRequest.mockResolvedValue(expectedResponse as any);

      const result = await controller.rejectRequest(mockRequest, 'target_nick');

      expect(friendService.rejectFriendRequest).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('removeFriend', () => {
    it('should call removeFriend on service', async () => {
      const expectedResponse = { success: true };
      friendService.removeFriend.mockResolvedValue(expectedResponse as any);

      const result = await controller.removeFriend(mockRequest, 'target_nick');

      expect(friendService.removeFriend).toHaveBeenCalledWith('user-id-123', 'target_nick');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getReceivedRequests', () => {
    it('should call getReceivedRequests on service', async () => {
      const expectedResponse = [{ id: 'req-1', status: 'PENDING', sender: { nick: 'gildo' } }];
      friendService.getReceivedRequests.mockResolvedValue(expectedResponse as any);

      const result = await controller.getReceivedRequests(mockRequest);

      expect(friendService.getReceivedRequests).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSentRequests', () => {
    it('should call getSentRequests on service', async () => {
      const expectedResponse = [{ id: 'req-2', status: 'PENDING', receiver: { nick: 'daniel' } }];
      friendService.getSentRequests.mockResolvedValue(expectedResponse as any);

      const result = await controller.getSentRequests(mockRequest);

      expect(friendService.getSentRequests).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(expectedResponse);
    });
  });
});
