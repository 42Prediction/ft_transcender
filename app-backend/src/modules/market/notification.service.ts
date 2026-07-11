import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bettor } from '../bettor/entities/bettor.entity';
import { Market } from './entities/market.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { MarketGateway } from './market.gateway';

const INBOX_LIMIT = 30;
/** Nicks mentioned in a chat message, e.g. "@ana gg" -> ["ana"]. */
const MENTION_RE = /(?:^|\s)@([A-Za-z0-9_.-]+)/g;

interface NewNotification {
  bettorId: string;
  type: NotificationType;
  marketId?: string | null;
  data?: Record<string, unknown> | null;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Bettor)
    private readonly bettorRepo: Repository<Bettor>,
    @InjectRepository(Market)
    private readonly marketRepo: Repository<Market>,
    // Circular: the gateway creates chat-mention notifications, and this
    // service pushes every notification back out through the gateway.
    @Inject(forwardRef(() => MarketGateway))
    private readonly gateway: MarketGateway,
  ) {}

  /** Persists notifications and pushes each to its recipient's live sockets. */
  async createMany(items: NewNotification[]): Promise<void> {
    if (items.length === 0) return;
    const entities = items.map((item) =>
      this.notificationRepo.create({
        bettorId: item.bettorId,
        type: item.type,
        marketId: item.marketId ?? null,
        data: item.data ?? null,
        isRead: false,
      }),
    );
    const saved = await this.notificationRepo.save(entities);
    for (const notif of saved) {
      this.gateway.emitNotification(notif.bettorId, notif);
    }
  }

  async list(bettorId: string) {
    return this.notificationRepo.find({
      where: { bettorId },
      order: { createdAt: 'DESC' },
      take: INBOX_LIMIT,
    });
  }

  async unreadCount(bettorId: string): Promise<number> {
    return this.notificationRepo.count({ where: { bettorId, isRead: false } });
  }

  async markRead(bettorId: string, id: string): Promise<void> {
    await this.notificationRepo.update({ id, bettorId }, { isRead: true });
  }

  async markAllRead(bettorId: string): Promise<void> {
    await this.notificationRepo.update({ bettorId, isRead: false }, { isRead: true });
  }

  /**
   * Resolves the @nicks in a chat message to real bettors (excluding the
   * author) and notifies each that they were mentioned.
   */
  async createChatMention(params: {
    marketId: string;
    fromBettorId: string;
    fromNick: string;
    text: string;
  }): Promise<void> {
    const nicks = this.extractMentions(params.text, params.fromNick);
    if (nicks.length === 0) return;

    const bettors = await this.bettorRepo.find({ where: { nick: In(nicks) } });
    const recipients = bettors.filter((b) => b.id !== params.fromBettorId);
    if (recipients.length === 0) return;

    const market = await this.marketRepo.findOne({ where: { id: params.marketId } });
    const excerpt =
      params.text.length > 120 ? `${params.text.slice(0, 117)}…` : params.text;

    await this.createMany(
      recipients.map((b) => ({
        bettorId: b.id,
        type: NotificationType.CHAT_MENTION,
        marketId: params.marketId,
        data: {
          fromNick: params.fromNick,
          project: market?.project ?? null,
          subject: market?.subjectLogin ?? null,
          excerpt,
        },
      })),
    );
  }

  private extractMentions(text: string, selfNick: string): string[] {
    const found = new Set<string>();
    const self = selfNick.toLowerCase();
    for (const match of text.matchAll(MENTION_RE)) {
      const nick = match[1];
      if (nick.toLowerCase() !== self) found.add(nick);
    }
    return [...found];
  }
}
