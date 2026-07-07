import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { Bettor } from '../bettor/entities/bettor.entity';

export interface ChatMessage {
  id: string;
  marketId: string;
  bettorId: string;
  nick: string;
  avatar: string | null;
  text: string;
  createdAt: string;
}

interface ChatIdentity {
  id: string;
  nick: string;
  avatar: string | null;
}

/** Chat is deliberately ephemeral — a rolling window per market, no persistence. */
const CHAT_HISTORY_LIMIT = 50;
const CHAT_MESSAGE_MAX_LENGTH = 500;
/** Minimum gap between messages from one socket, to keep spam from flooding a room. */
const CHAT_SEND_COOLDOWN_MS = 500;

@WebSocketGateway({
  namespace: '/market',
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MarketGateway.name);
  private readonly chatHistory = new Map<string, ChatMessage[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Bettor)
    private readonly bettorRepo: Repository<Bettor>,
  ) {}

  handleConnection(client: Socket) {
    // The browser sends the auth cookie on the socket handshake
    // (withCredentials), but handshakes bypass the HTTP cookie-parser
    // middleware — extract and verify the JWT by hand. Anonymous sockets
    // stay connected: market updates are public, only chat:send needs an
    // identity.
    client.data.userId = this.extractUserId(client);
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitMarketUpdate(market: unknown) {
    this.server?.emit('market:update', market);
  }

  emitMarketRemoved(marketId: string) {
    this.server?.emit('market:removed', marketId);
  }

  /** Joins the market's chat room; the ack carries the rolling history so the client can render instantly. */
  @SubscribeMessage('chat:join')
  handleChatJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() marketId: unknown,
  ): { messages: ChatMessage[] } {
    if (typeof marketId !== 'string' || !marketId) return { messages: [] };
    void client.join(this.chatRoom(marketId));
    return { messages: this.chatHistory.get(marketId) ?? [] };
  }

  @SubscribeMessage('chat:leave')
  handleChatLeave(@ConnectedSocket() client: Socket, @MessageBody() marketId: unknown) {
    if (typeof marketId !== 'string' || !marketId) return;
    void client.leave(this.chatRoom(marketId));
  }

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { marketId?: unknown; text?: unknown },
  ): Promise<{ message: ChatMessage } | { error: string }> {
    const userId = client.data.userId as string | null;
    if (!userId) return { error: 'Sign in to join the chat.' };

    const marketId = body?.marketId;
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (typeof marketId !== 'string' || !marketId || !text) {
      return { error: 'Message cannot be empty.' };
    }
    if (text.length > CHAT_MESSAGE_MAX_LENGTH) {
      return { error: `Message is too long (max ${CHAT_MESSAGE_MAX_LENGTH} characters).` };
    }

    const lastSentAt = (client.data.lastChatAt as number | undefined) ?? 0;
    if (Date.now() - lastSentAt < CHAT_SEND_COOLDOWN_MS) {
      return { error: 'You are sending messages too fast.' };
    }

    const bettor = await this.resolveBettor(client, userId);
    if (!bettor) return { error: 'Complete your bettor profile to chat.' };

    client.data.lastChatAt = Date.now();

    const message: ChatMessage = {
      id: randomUUID(),
      marketId,
      bettorId: bettor.id,
      nick: bettor.nick,
      avatar: bettor.avatar,
      text,
      createdAt: new Date().toISOString(),
    };

    const history = this.chatHistory.get(marketId) ?? [];
    history.push(message);
    if (history.length > CHAT_HISTORY_LIMIT) {
      history.splice(0, history.length - CHAT_HISTORY_LIMIT);
    }
    this.chatHistory.set(marketId, history);

    this.server.to(this.chatRoom(marketId)).emit('chat:message', message);
    return { message };
  }

  private chatRoom(marketId: string): string {
    return `chat:${marketId}`;
  }

  private extractUserId(client: Socket): string | null {
    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (!match) return null;

    try {
      const payload = this.jwtService.verify<{ sub: string }>(decodeURIComponent(match[1]), {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  /**
   * The JWT `sub` is the User id, not the Bettor — resolve (and cache on the
   * socket) the bettor profile that authors this socket's chat messages.
   */
  private async resolveBettor(client: Socket, userId: string): Promise<ChatIdentity | null> {
    const cached = client.data.chatIdentity as ChatIdentity | undefined;
    if (cached) return cached;

    const bettor = await this.bettorRepo.findOne({ where: { user: { id: userId } } });
    if (!bettor) return null;

    const identity: ChatIdentity = {
      id: bettor.id,
      nick: bettor.nick,
      avatar: bettor.avatar ?? null,
    };
    client.data.chatIdentity = identity;
    return identity;
  }
}
