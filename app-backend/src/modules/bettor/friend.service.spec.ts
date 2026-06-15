import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { FriendService } from './friend.service';
import { Bettor } from './entities/bettor.entity';
import { BettorFriendRequest, RequestStatus } from './entities/friend.entity';

describe('FriendService', () => {
  let service: FriendService;

  const mockQueryBuilder = {
    relation: jest.fn().mockReturnThis(),
    of: jest.fn().mockReturnThis(),
    remove: jest.fn().mockResolvedValue(true),
    add: jest.fn().mockResolvedValue(true),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
  };

const mockTransactionalEntityManager = {
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionHandler = jest.fn().mockImplementation((...args) => {
    const cb = args.length === 2 ? args[1] : args[0];
    return cb(mockTransactionalEntityManager);
  });

  const mockBettorRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: {
      transaction: jest.fn().mockImplementation((cb) => cb(mockTransactionalEntityManager)),
    },
  };

  const mockRequestRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    manager: { transaction: mockTransactionHandler },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendService,
        {
          provide: getRepositoryToken(Bettor),
          useValue: mockBettorRepository,
        },
        {
          provide: getRepositoryToken(BettorFriendRequest),
          useValue: mockRequestRepository,
        },
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('sendFriendRequest', () => {
    const mockSender = { id: 'uuid-1', nick: 'gildo' } as Bettor;
    const mockReceiver = { id: 'uuid-2', nick: 'marcelo' } as Bettor;

    beforeEach(() => {
      jest.clearAllMocks();
      mockBettorRepository.findOne
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce(mockReceiver);
      mockQueryBuilder.getCount.mockResolvedValue(0); 
      mockTransactionalEntityManager.findOne.mockResolvedValue(null);
      mockTransactionalEntityManager.create.mockReturnValue({ id: 'req-1' });
    });

    it('deve atirar NotFoundException se sender ou receiver não existirem', async () => {
      mockBettorRepository.findOne.mockReset();
      mockBettorRepository.findOne.mockResolvedValueOnce(mockSender).mockResolvedValueOnce(null);

      await expect(service.sendFriendRequest('uuid-1', 'fantasma')).rejects.toThrow(NotFoundException);
    });

    it('deve atirar BadRequestException ao tentar enviar pedido para si mesmo', async () => {
      mockBettorRepository.findOne.mockReset();
      mockBettorRepository.findOne.mockResolvedValueOnce(mockSender).mockResolvedValueOnce(mockSender);

      await expect(service.sendFriendRequest('uuid-1', 'gildo')).rejects.toThrow(BadRequestException);
    });

    it('deve atirar ConflictException se já forem amigos', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      await expect(service.sendFriendRequest('uuid-1', 'marcelo')).rejects.toThrow(ConflictException);
    });

    it('deve atirar ConflictException se já existir um pedido cruzado (Race Condition de pedidos)', async () => {
      mockTransactionalEntityManager.findOne.mockResolvedValue({ id: 'req-existente' });

      await expect(service.sendFriendRequest('uuid-1', 'marcelo')).rejects.toThrow(ConflictException);
    });

    it('deve atirar ConflictException em caso de erro 23505 (PostgreSQL Unique Constraint)', async () => {
      mockTransactionalEntityManager.save.mockRejectedValueOnce({ code: '23505' }); 

      await expect(service.sendFriendRequest('uuid-1', 'marcelo')).rejects.toThrow(ConflictException);
    });

    it('deve criar e gravar um pedido de amizade com sucesso sob isolamento SERIALIZABLE', async () => {
      await service.sendFriendRequest('uuid-1', 'marcelo');

      expect(mockRequestRepository.manager.transaction).toHaveBeenCalledWith('SERIALIZABLE', expect.any(Function));

      expect(mockTransactionalEntityManager.findOne).toHaveBeenCalledWith(BettorFriendRequest, {
        where: [
          { sender: { id: mockSender.id }, receiver: { id: mockReceiver.id } },
          { sender: { id: mockReceiver.id }, receiver: { id: mockSender.id } }
        ]
      });

      expect(mockTransactionalEntityManager.create).toHaveBeenCalledWith(BettorFriendRequest, {
        sender: { id: mockSender.id },
        receiver: { id: mockReceiver.id },
        status: RequestStatus.PENDING,
      });
      expect(mockTransactionalEntityManager.save).toHaveBeenCalledWith({ id: 'req-1' });
    });
  });

  describe('getReceivedRequests', () => {
    
    it('deve retornar a lista de pedidos pendentes usando as relations corretas', async () => {
      const mockUserId = 'uuid-marcelo';
      const mockRequests = [
        { id: 'req-1', status: RequestStatus.PENDING, sender: { nick: 'gildo' } },
        { id: 'req-2', status: RequestStatus.PENDING, sender: { nick: 'nelson' } }
      ];

      mockRequestRepository.find.mockResolvedValue(mockRequests);

      const result = await service.getReceivedRequests(mockUserId);

      expect(result).toEqual(mockRequests);

      expect(mockRequestRepository.find).toHaveBeenCalledWith({
        where: { receiver: { user: { id: mockUserId } }, status: RequestStatus.PENDING },
        relations: ['sender'],
      });
    });
  });

  describe('acceptFriendRequest', () => {

    it('deve atirar NotFoundException se o perfil ou o remetente não existirem', async () => {
      mockBettorRepository.findOne
        .mockResolvedValueOnce({ id: 'uuid-1', nick: 'gildo' } as Bettor)
        .mockResolvedValueOnce(null);

      await expect(service.acceptFriendRequest('uuid-1', 'fantasma')).rejects.toThrow(NotFoundException);
    });

    it('deve atirar ConflictException se o pedido não estiver PENDING (Race Condition de cliques)', async () => {
      const mockReceiver = { id: 'uuid-1', nick: 'gildo' } as Bettor;
      const mockSender = { id: 'uuid-2', nick: 'marcelo' } as Bettor;

      mockBettorRepository.findOne
        .mockResolvedValueOnce(mockReceiver)
        .mockResolvedValueOnce(mockSender);

      mockTransactionalEntityManager.update.mockResolvedValueOnce({ affected: 0 });

      await expect(service.acceptFriendRequest('uuid-1', 'marcelo')).rejects.toThrow(ConflictException);
    });

    it('deve aceitar o pedido com sucesso, alterando o estado e criando os elos de amizade na base de dados', async () => {
      const mockReceiver = { id: 'uuid-1', nick: 'gildo' } as Bettor;
      const mockSender = { id: 'uuid-2', nick: 'marcelo' } as Bettor;
      const mockRequest = { id: 'req-1', status: RequestStatus.PENDING, sender: mockSender, receiver: mockReceiver } as BettorFriendRequest;

      mockBettorRepository.findOne
        .mockResolvedValueOnce(mockReceiver)
        .mockResolvedValueOnce(mockSender);

      mockTransactionalEntityManager.findOne.mockResolvedValueOnce(mockRequest);
      mockTransactionalEntityManager.update.mockResolvedValueOnce({ affected: 1 });

      await service.acceptFriendRequest('uuid-1', 'marcelo');

      expect(mockTransactionalEntityManager.update).toHaveBeenCalled();
    });
    

  });

  describe('rejectFriendRequest', () => {
    it('deve remover atómicamente o pedido da base de dados se for rejeitado', async () => {
      mockBettorRepository.findOne
        .mockResolvedValueOnce({ id: 'uuid-1' } as Bettor)
        .mockResolvedValueOnce({ id: 'uuid-2' } as Bettor);

      mockRequestRepository.delete.mockResolvedValue({ affected: 1 });

      await service.rejectFriendRequest('uuid-1', 'gildo');

      expect(mockRequestRepository.delete).toHaveBeenCalledWith({
        receiver: { id: 'uuid-1' },
        sender: { id: 'uuid-2' },
        status: RequestStatus.PENDING,
      });
    });

    it('deve atirar NotFoundException se a base de dados não apagar nenhuma linha (clique duplo/já rejeitado)', async () => {
      mockBettorRepository.findOne
        .mockResolvedValueOnce({ id: 'uuid-1' } as Bettor) 
        .mockResolvedValueOnce({ id: 'uuid-2' } as Bettor);
        
      mockRequestRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.rejectFriendRequest('uuid-1', 'gildo')).rejects.toThrow(NotFoundException);
    });

    it('deve atirar NotFoundException se os perfis não existirem', async () => {
      mockBettorRepository.findOne.mockResolvedValue(null);
      await expect(service.rejectFriendRequest('uuid-1', 'fantasma')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelFriendRequest', () => {
    it('deve remover atómicamente o pedido enviado se o utilizador cancelar', async () => {
      mockBettorRepository.findOne
        .mockResolvedValueOnce({ id: 'uuid-1' } as Bettor)
        .mockResolvedValueOnce({ id: 'uuid-2' } as Bettor);

      mockRequestRepository.delete.mockResolvedValue({ affected: 1 });

      await service.cancelFriendRequest('uuid-1', 'marcelo');

      expect(mockRequestRepository.delete).toHaveBeenCalledWith({
        sender: { id: 'uuid-1' },
        receiver: { id: 'uuid-2' },
        status: RequestStatus.PENDING,
      });
    });

    it('deve atirar NotFoundException se tentar cancelar um pedido que já não existe pendente', async () => {
      mockBettorRepository.findOne
        .mockResolvedValueOnce({ id: 'uuid-1' } as Bettor) 
        .mockResolvedValueOnce({ id: 'uuid-2' } as Bettor);
        
      mockRequestRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.cancelFriendRequest('uuid-1', 'fantasma')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFriend', () => {
    
    it('deve atirar NotFoundException se um dos perfis não for encontrado', async () => {
      mockBettorRepository.findOne
        .mockResolvedValueOnce({ id: 'uuid-1', nick: 'gildo' } as Bettor)
        .mockResolvedValueOnce(null);

      await expect(service.removeFriend('uuid-1', 'fantasma')).rejects.toThrow(NotFoundException);
    });

    it('deve remover a amizade mutuamente através do queryBuilder e limpar o histórico de pedidos', async () => {
      const mockMe = { id: 'uuid-1', nick: 'gildo' } as Bettor;
      const mockFriend = { id: 'uuid-2', nick: 'marcelo' } as Bettor;

      mockBettorRepository.findOne
        .mockResolvedValueOnce(mockMe)
        .mockResolvedValueOnce(mockFriend);

      await service.removeFriend('uuid-1', 'marcelo');

      expect(mockBettorRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.relation).toHaveBeenCalledWith(Bettor, 'friends');
      expect(mockQueryBuilder.of).toHaveBeenCalledWith(mockMe.id);
      expect(mockQueryBuilder.remove).toHaveBeenCalledWith(mockFriend.id);
      expect(mockQueryBuilder.of).toHaveBeenCalledWith(mockFriend.id);
      expect(mockQueryBuilder.remove).toHaveBeenCalledWith(mockMe.id);
      expect(mockRequestRepository.delete).toHaveBeenCalledWith({
        sender: { id: mockMe.id }, receiver: { id: mockFriend.id }
      });
      expect(mockRequestRepository.delete).toHaveBeenCalledWith({
        sender: { id: mockFriend.id }, receiver: { id: mockMe.id }
      });
    });

    it('deve propagar o erro original se o QueryBuilder falhar catastroficamente ao remover a relação', async () => {
      const mockMe = { id: 'uuid-1', nick: 'carlos' } as unknown as Bettor;
      const mockFriend = { id: 'uuid-2', nick: 'marcelo' } as unknown as Bettor;

      mockBettorRepository.findOne
        .mockResolvedValueOnce(mockMe)
        .mockResolvedValueOnce(mockFriend);

      mockQueryBuilder.remove.mockRejectedValueOnce(new Error('Database Connection Lost'));

      await expect(service.removeFriend('uuid-1', 'marcelo')).rejects.toThrow('Database Connection Lost');
    });
  });

  describe('getMyFriends', () => {
    it('deve retornar a lista de amigos do utilizador se o perfil existir', async () => {
      const mockFriends = [{ id: 'friend-1', nick: 'amigo1' }] as Bettor[];
      mockBettorRepository.findOne.mockResolvedValueOnce({
        id: 'user-uuid',
        friends: mockFriends,
      } as Bettor);

      const result = await service.getMyFriends('user-uuid');

      expect(mockBettorRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'user-uuid' } },
        relations: ['friends'],
      });
      expect(result).toEqual(mockFriends);
    });

    it('deve retornar um array vazio se o utilizador não tiver amigos associados', async () => {
      mockBettorRepository.findOne.mockResolvedValueOnce({
        id: 'user-uuid',
        friends: null,
      } as unknown as Bettor);

      const result = await service.getMyFriends('user-uuid');
      expect(result).toEqual([]);
    });

    it('deve atirar NotFoundException se o perfil do utilizador não for encontrado', async () => {
      mockBettorRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getMyFriends('user-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicFriends', () => {
    it('deve retornar a lista de amigos de um perfil público através do nick', async () => {
      const mockFriends = [{ id: 'friend-2', nick: 'amigo2' }] as Bettor[];
      mockBettorRepository.findOne.mockResolvedValueOnce({
        id: 'target-uuid',
        nick: 'carlos',
        friends: mockFriends,
      } as Bettor);

      const result = await service.getPublicFriends('carlos');

      expect(mockBettorRepository.findOne).toHaveBeenCalledWith({
        where: { nick: 'carlos' },
        relations: ['friends'],
      });
      expect(result).toEqual(mockFriends);
    });

    it('deve atirar NotFoundException se o perfil público do nick não existir', async () => {
      mockBettorRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getPublicFriends('fantasma')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReceivedRequests', () => {
    it('deve buscar e retornar os pedidos de amizade recebidos com status PENDING', async () => {
      const mockRequests = [
        { id: 'req-1', status: RequestStatus.PENDING, sender: { nick: 'manuel' } },
      ] as BettorFriendRequest[];

      mockRequestRepository.find.mockResolvedValueOnce(mockRequests);

      const result = await service.getReceivedRequests('user-uuid');

      expect(mockRequestRepository.find).toHaveBeenCalledWith({
        where: {
          receiver: { user: { id: 'user-uuid' } },
          status: RequestStatus.PENDING,
        },
        relations: ['sender'],
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('getSentRequests', () => {
    it('deve buscar e retornar os pedidos de amizade enviados com status PENDING', async () => {
      const mockRequests = [
        { id: 'req-2', status: RequestStatus.PENDING, receiver: { nick: 'joana' } },
      ] as BettorFriendRequest[];

      mockRequestRepository.find.mockResolvedValueOnce(mockRequests);

      const result = await service.getSentRequests('user-uuid');

      expect(mockRequestRepository.find).toHaveBeenCalledWith({
        where: {
          sender: { user: { id: 'user-uuid' } },
          status: RequestStatus.PENDING,
        },
        relations: ['receiver'],
      });
      expect(result).toEqual(mockRequests);
    });
  });
});
