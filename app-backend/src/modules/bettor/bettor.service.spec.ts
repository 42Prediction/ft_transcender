import { Test, TestingModule } from '@nestjs/testing';
import { BettorService } from './bettor.service';
import { AvatarService } from './avatar.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Bettor } from './entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateBettorDto } from './dto/update-bettor.dto';

const mockToDataUri = jest.fn(() => 'data:image/svg+xml;base64,mocked-avatar');

function mockCreateAvatar() {
  return {
    toDataUri: mockToDataUri,
  };
}

jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(mockCreateAvatar),
}));

jest.mock('@dicebear/collection', () => ({
  avataaarsNeutral: { name: 'avataaarsNeutral' },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  }));
});

const { createAvatar: mockedCreateAvatar } = jest.requireMock('@dicebear/core') as {
  createAvatar: jest.Mock;
};

describe('BettorService', () => {
  let service: BettorService;
  let bettorRepository: Repository<Bettor>;
  let avatarService: AvatarService;

  const mockBettorRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockAvatarService = {
    extractFilename: jest.fn(),
    processAndSave: jest.fn(),
    deleteOldAvatar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BettorService,
        {
          provide: getRepositoryToken(Bettor),
          useValue: mockBettorRepository,
        },
        {
          provide: AvatarService,
          useValue: mockAvatarService,
        },
      ],
    }).compile();

    service = module.get<BettorService>(BettorService);
    bettorRepository = module.get<Repository<Bettor>>(getRepositoryToken(Bettor));
    avatarService = module.get<AvatarService>(AvatarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockToDataUri.mockReturnValue('data:image/svg+xml;base64,mocked-avatar');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a bettor', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' } as User;
      const mockBettor = { nick: 'test_1234', avatar: 'data:image/svg+xml;base64,mocked-avatar', user: mockUser } as Bettor;

      mockBettorRepository.create.mockReturnValue(mockBettor);
      mockBettorRepository.save.mockResolvedValue(mockBettor);

      const result = await service.create(mockUser);

      expect(mockBettorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          avatar: 'data:image/svg+xml;base64,mocked-avatar',
          nick: expect.any(String),
        }),
      );
      expect(mockedCreateAvatar).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'avataaarsNeutral' }),
        { seed: mockUser.email },
      );
      expect(mockToDataUri).toHaveBeenCalled();
      expect(mockBettorRepository.save).toHaveBeenCalledWith(mockBettor);
      expect(result).toEqual(mockBettor);
    });

    it('should throw InternalServerErrorException if user is missing', async () => {
      await expect(service.create(null as any)).rejects.toThrow(
        new InternalServerErrorException('User id required'),
      );
    });
  });

  describe('nickExists', () => {
    it('Cenário 1: Deve retornar true se o utilizador com o nickname indicado existir', async () => {
      mockBettorRepository.count.mockResolvedValueOnce(1);

      const result = await service.nickExists('marco');

      expect(result).toBe(true);
      expect(mockBettorRepository.count).toHaveBeenCalledWith({
        where: { nick: 'marco' },
      });
    });

    it('Cenário 2: Deve retornar false se o utilizador com o nickname indicado não existir', async () => {
      mockBettorRepository.count.mockResolvedValueOnce(0);

      const result = await service.nickExists('nickname_inexistente');

      expect(result).toBe(false);
      expect(mockBettorRepository.count).toHaveBeenCalledWith({
        where: { nick: 'nickname_inexistente' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a bettor if found by user id', async () => {
      const mockBettor = { id: '1', nick: 'player1' } as Bettor;
      mockBettorRepository.findOne.mockResolvedValue(mockBettor);

      const result = await service.findOne('user-id');

      expect(mockBettorRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'user-id' } },
        relations: ['user'],
      });
      expect(result).toEqual(mockBettor);
    });
  });

  describe('findByNick', () => {
    it('should return a bettor if found by nick', async () => {
      const mockBettor = { id: '1', nick: 'player1' } as Bettor;
      mockBettorRepository.findOne.mockResolvedValue(mockBettor);

      const result = await service.findByNick('player1');

      expect(mockBettorRepository.findOne).toHaveBeenCalledWith({ where: { nick: 'player1' } });
      expect(result).toEqual(mockBettor);
    });

    it('should throw NotFoundException if bettor is not found', async () => {
      mockBettorRepository.findOne.mockResolvedValue(null);

      await expect(service.findByNick('unknown')).rejects.toThrow(
        new NotFoundException('Bettor not found'),
      );
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    let existingBettor: Bettor;
    let updateDto: UpdateBettorDto;

    beforeEach(() => {
      existingBettor = {
        id: 'bettor-123',
        nick: 'old_nick',
        avatar: 'avatar/old.png',
        isNickSetted: false,
        user: { id: userId } as User,
      } as Bettor;

      updateDto = { nick: 'new_nick' };
    });

    it('should throw NotFoundException if bettor to update does not exist', async () => {
      mockBettorRepository.findOne.mockResolvedValue(null);

      await expect(service.update(userId, updateDto)).rejects.toThrow(
        new NotFoundException('Bettor not found'),
      );
    });

    it('should update nick successfully and set isNickSetted to true', async () => {
      mockBettorRepository.findOne
        .mockResolvedValueOnce(existingBettor)
        .mockResolvedValueOnce(null);

      mockBettorRepository.save.mockImplementation(async (data) => data);

      const result = await service.update(userId, updateDto);

      expect(result.nick).toBe('new_nick');
      expect(result.isNickSetted).toBe(true);
      expect(mockBettorRepository.save).toHaveBeenCalledWith(existingBettor);
    });

    it('should throw ConflictException if new nick is already in use', async () => {
      mockBettorRepository.findOne
        .mockResolvedValueOnce(existingBettor)
        .mockResolvedValueOnce({ id: 'another-bettor-id' } as Bettor);

      await expect(service.update(userId, updateDto)).rejects.toThrow(
        new ConflictException('Nick already in use, choose another'),
      );
    });

    it('should process, save new avatar and delete the old one if avatarFile is provided', async () => {
      const mockFile = { filename: 'new-file.png' } as Express.Multer.File;
      
      mockBettorRepository.findOne.mockResolvedValueOnce(existingBettor);
      mockAvatarService.extractFilename.mockReturnValue('old.png');
      mockAvatarService.processAndSave.mockResolvedValue('processed-new-file.png');
      mockBettorRepository.save.mockImplementation(async (data) => data);

      const result = await service.update(userId, {}, mockFile);

      expect(mockAvatarService.extractFilename).toHaveBeenCalledWith('avatar/old.png');
      expect(mockAvatarService.processAndSave).toHaveBeenCalledWith(mockFile);
      expect(mockAvatarService.deleteOldAvatar).toHaveBeenCalledWith('old.png');
      expect(result.avatar).toBe('processed-new-file.png');
    });
  });
});