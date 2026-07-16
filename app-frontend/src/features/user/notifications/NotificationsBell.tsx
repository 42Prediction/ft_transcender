import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, MessageSquare, TrendingDown, TrendingUp, UserCheck, UserPlus, XCircle } from 'lucide-react';
import { useNotifications } from './useNotifications';
import type { AppNotification } from '@/api/notification/notification.api';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function describe(n: AppNotification): { icon: typeof Bell; tint: string; title: string; body: string } {
  const d = n.data ?? {};
  const project = d.project ?? 'a market';
  if (n.type === 'bet_resolved') {
    const won = d.outcome === 'won';
    const pnl = typeof d.pnl === 'number' ? d.pnl : null;
    return {
      icon: won ? TrendingUp : TrendingDown,
      tint: won ? 'text-success' : 'text-destructive',
      title: won ? 'You won a bet' : 'You lost a bet',
      body:
        `${project} resolved` +
        (pnl != null ? ` · ${pnl >= 0 ? '+' : ''}xp ${Math.abs(pnl).toFixed(2)}` : ''),
    };
  }
  if (n.type === 'bet_cancelled') {
    const amount = typeof d.amount === 'number' ? d.amount : null;
    return {
      icon: XCircle,
      tint: 'text-muted-foreground',
      title: 'Bet refunded',
      body: `${project} was cancelled` + (amount != null ? ` · xp ${amount.toFixed(2)} back` : ''),
    };
  }
  if (n.type === 'friend_request_received') {
    return {
      icon: UserPlus,
      tint: 'text-primary',
      title: 'New friend request',
      body: `@${d.fromNick ?? 'someone'} wants to be your friend`,
    };
  }
  if (n.type === 'friend_request_accepted') {
    return {
      icon: UserCheck,
      tint: 'text-success',
      title: 'Friend request accepted',
      body: `@${d.fromNick ?? 'someone'} accepted your friend request`,
    };
  }
  return {
    icon: MessageSquare,
    tint: 'text-primary',
    title: `@${d.fromNick ?? 'someone'} mentioned you`,
    body: d.excerpt ? String(d.excerpt) : `in ${project} chat`,
  };
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { items, unread, loading, markAllRead, markRead } = useNotifications(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onItemClick = (n: AppNotification) => {
    if (!n.isRead) void markRead(n.id);
    setOpen(false);
    if (n.marketId) {
      navigate(`/market/${n.marketId}`);
    } else if (
      (n.type === 'friend_request_received' || n.type === 'friend_request_accepted') &&
      n.data?.fromNick
    ) {
      navigate(`/user/${n.data.fromNick}`);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground shadow-glow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-20 z-50 origin-top-right rounded-xl border border-border/60 bg-background p-2 shadow-xl backdrop-blur-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-[380px]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <h3 className="font-display text-sm font-semibold">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="mt-1 max-h-[60vh] space-y-1 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              items.map((n) => {
                const { icon: Icon, tint, title, body } = describe(n);
                return (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface ${
                      n.isRead ? 'opacity-70' : 'bg-surface/40'
                    }`}
                  >
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface ${tint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{title}</span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{body}</p>
                    </div>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
