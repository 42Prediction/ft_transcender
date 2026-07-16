import { forwardRef, Inject, Logger } from '@nestjs/common';
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
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';

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


const CHAT_HISTORY_LIMIT = 50;
const CHAT_MESSAGE_MAX_LENGTH = 500;

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
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
 
    const userId = this.extractUserId(client);
    client.data.userId = userId;

  
    if (userId) {
      const bettor = await this.resolveBettor(client, userId);
      if (bettor) void client.join(this.notificationRoom(bettor.id));
    }
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


  emitNotification(bettorId: string, notification: Notification) {
    this.server?.to(this.notificationRoom(bettorId)).emit('notification:new', notification);
  }


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

 
    if (text.includes('@')) {
      this.notificationService
        .createChatMention({
          marketId,
          fromBettorId: bettor.id,
          fromNick: bettor.nick,
          text,
        })
        .catch((err) => this.logger.warn(`chat mention notify failed: ${err}`));
    }

    return { message };
  }

  private chatRoom(marketId: string): string {
    return `chat:${marketId}`;
  }

  private notificationRoom(bettorId: string): string {
    return `notif:${bettorId}`;
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
