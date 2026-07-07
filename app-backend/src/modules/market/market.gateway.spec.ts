import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Bettor } from '../bettor/entities/bettor.entity';
import { MarketGateway } from './market.gateway';

function fakeSocket(cookie?: string) {
  return {
    id: 'sock-1',
    data: {} as Record<string, unknown>,
    handshake: { headers: cookie ? { cookie } : {} },
    join: jest.fn(),
    leave: jest.fn(),
  } as any;
}

describe('MarketGateway chat', () => {
  let gateway: MarketGateway;
  let bettorRepo: { findOne: jest.Mock };
  let jwtService: { verify: jest.Mock };
  let roomEmit: jest.Mock;

  beforeEach(async () => {
    bettorRepo = { findOne: jest.fn() };
    jwtService = { verify: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        MarketGateway,
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
        { provide: getRepositoryToken(Bettor), useValue: bettorRepo },
      ],
    }).compile();

    gateway = module.get(MarketGateway);
    roomEmit = jest.fn();
    gateway.server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: roomEmit }),
    } as any;
  });

  describe('handleConnection auth', () => {
    it('stores the user id from a valid access_token cookie', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const client = fakeSocket('foo=bar; access_token=tok123');

      gateway.handleConnection(client);

      expect(jwtService.verify).toHaveBeenCalledWith('tok123', { secret: 'test-secret' });
      expect(client.data.userId).toBe('user-1');
    });

    it('leaves the socket anonymous when there is no cookie', () => {
      const client = fakeSocket();
      gateway.handleConnection(client);
      expect(client.data.userId).toBeNull();
    });

    it('leaves the socket anonymous when the token is invalid', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('bad token');
      });
      const client = fakeSocket('access_token=expired');

      gateway.handleConnection(client);

      expect(client.data.userId).toBeNull();
    });
  });

  describe('chat:join / chat:leave', () => {
    it('joins the market room and acks the current history', () => {
      const client = fakeSocket();
      const res = gateway.handleChatJoin(client, 'm1');

      expect(client.join).toHaveBeenCalledWith('chat:m1');
      expect(res).toEqual({ messages: [] });
    });

    it('ignores a join without a market id', () => {
      const client = fakeSocket();
      const res = gateway.handleChatJoin(client, undefined);

      expect(client.join).not.toHaveBeenCalled();
      expect(res).toEqual({ messages: [] });
    });

    it('leaves the market room', () => {
      const client = fakeSocket();
      gateway.handleChatLeave(client, 'm1');
      expect(client.leave).toHaveBeenCalledWith('chat:m1');
    });
  });

  describe('chat:send', () => {
    function authedSocket() {
      const client = fakeSocket();
      client.data.userId = 'user-1';
      return client;
    }

    beforeEach(() => {
      bettorRepo.findOne.mockResolvedValue({ id: 'bettor-1', nick: 'zenick', avatar: null });
    });

    it('rejects anonymous sockets', async () => {
      const client = fakeSocket();
      client.data.userId = null;

      const res = await gateway.handleChatSend(client, { marketId: 'm1', text: 'oi' });

      expect(res).toEqual({ error: 'Sign in to join the chat.' });
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('rejects empty or whitespace-only messages', async () => {
      const res = await gateway.handleChatSend(authedSocket(), { marketId: 'm1', text: '   ' });
      expect(res).toEqual({ error: 'Message cannot be empty.' });
    });

    it('rejects messages over the length limit', async () => {
      const res = await gateway.handleChatSend(authedSocket(), {
        marketId: 'm1',
        text: 'x'.repeat(501),
      });
      expect(res).toMatchObject({ error: expect.stringContaining('too long') });
    });

    it('rejects when the user has no bettor profile', async () => {
      bettorRepo.findOne.mockResolvedValue(null);

      const res = await gateway.handleChatSend(authedSocket(), { marketId: 'm1', text: 'oi' });

      expect(res).toEqual({ error: 'Complete your bettor profile to chat.' });
    });

    it('broadcasts to the market room and acks the message', async () => {
      const client = authedSocket();

      const res = await gateway.handleChatSend(client, { marketId: 'm1', text: 'gm @amigo' });

      expect(bettorRepo.findOne).toHaveBeenCalledWith({ where: { user: { id: 'user-1' } } });
      expect(gateway.server.to).toHaveBeenCalledWith('chat:m1');
      expect(roomEmit).toHaveBeenCalledWith(
        'chat:message',
        expect.objectContaining({ marketId: 'm1', nick: 'zenick', text: 'gm @amigo' }),
      );
      expect(res).toMatchObject({
        message: { marketId: 'm1', bettorId: 'bettor-1', text: 'gm @amigo' },
      });
    });

    it('serves the joined history to late joiners, capped at 50 messages', async () => {
      const client = authedSocket();

      for (let i = 0; i < 55; i++) {
        client.data.lastChatAt = 0; // bypass the per-socket cooldown between test sends
        await gateway.handleChatSend(client, { marketId: 'm1', text: `msg ${i}` });
      }

      const late = fakeSocket();
      const res = gateway.handleChatJoin(late, 'm1');

      expect(res.messages).toHaveLength(50);
      expect(res.messages[0].text).toBe('msg 5');
      expect(res.messages[49].text).toBe('msg 54');
    });

    it('applies a per-socket cooldown between messages', async () => {
      const client = authedSocket();

      const first = await gateway.handleChatSend(client, { marketId: 'm1', text: 'one' });
      const second = await gateway.handleChatSend(client, { marketId: 'm1', text: 'two' });

      expect(first).toHaveProperty('message');
      expect(second).toEqual({ error: 'You are sending messages too fast.' });
    });

    it('caches the bettor identity per socket', async () => {
      const client = authedSocket();

      await gateway.handleChatSend(client, { marketId: 'm1', text: 'one' });
      client.data.lastChatAt = 0;
      await gateway.handleChatSend(client, { marketId: 'm1', text: 'two' });

      expect(bettorRepo.findOne).toHaveBeenCalledTimes(1);
    });
  });
});
