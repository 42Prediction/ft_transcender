import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouteLoaderData } from 'react-router-dom';
import { MessagesSquare, SendHorizonal } from 'lucide-react';
import { cn, LUANDA_TZ } from '@/lib/utils';
import { friendApi } from '@/api/bettor/friend.api';
import { useMarketChat } from '../hooks/useMarketChat';

function dicebear(seed: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: LUANDA_TZ });
}

interface Friend {
  id: string;
  nick: string;
}

const MENTION_SPLIT_RE = /(@[A-Za-z0-9_.-]+)/g;
/** The partial "@..." token being typed at the caret, if any. */
const ACTIVE_MENTION_RE = /(^|\s)@([A-Za-z0-9_.-]*)$/;
const MAX_SUGGESTIONS = 6;

function MessageText({ text, myNick }: { text: string; myNick?: string }) {
  return (
    <>
      {text.split(MENTION_SPLIT_RE).map((part, i) =>
        part.startsWith('@') ? (
          <span
            key={i}
            className={cn(
              'font-mono text-primary',
              myNick && part.slice(1) === myNick && 'rounded bg-primary/15 px-1',
            )}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function MarketChat({ marketId }: { marketId: string }) {
  const root = useRouteLoaderData('root') as any;
  const myNick: string | undefined = root?.data?.nick;
  const isLoggedIn = Boolean(myNick);

  const { messages, sendMessage } = useMarketChat(marketId);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [mentionOpen, setMentionOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    friendApi
      .getFriends()
      .then((res) => {
        const list = (res.data?.data ?? []) as Array<{ id: string; nick: string }>;
        setFriends(list.map((f) => ({ id: f.id, nick: f.nick })));
      })
      .catch(() => setFriends([]));
  }, [isLoggedIn]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const mentionQuery = useMemo(() => {
    const caret = inputRef.current?.selectionStart ?? draft.length;
    const match = draft.slice(0, caret).match(ACTIVE_MENTION_RE);
    return match ? match[2].toLowerCase() : null;
  }, [draft]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return friends
      .filter((f) => f.nick.toLowerCase().startsWith(mentionQuery))
      .slice(0, MAX_SUGGESTIONS);
  }, [friends, mentionQuery]);

  useEffect(() => {
    setMentionOpen(suggestions.length > 0);
    setHighlighted(0);
  }, [suggestions.length, mentionQuery]);

  const insertMention = (nick: string) => {
    const caret = inputRef.current?.selectionStart ?? draft.length;
    const before = draft.slice(0, caret).replace(ACTIVE_MENTION_RE, `$1@${nick} `);
    setDraft(before + draft.slice(caret));
    setMentionOpen(false);
    inputRef.current?.focus();
  };

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    const res = await sendMessage(text);
    setSending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDraft('');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((h) => (h + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(suggestions[highlighted].nick);
        return;
      }
      if (e.key === 'Escape') {
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card shadow-card">
      <header className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <MessagesSquare className="h-4.5 w-4.5 text-muted-foreground" /> Chat
        </h2>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live
        </span>
      </header>

      <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex items-start gap-2.5">
              <img
                src={m.avatar ?? dicebear(m.nick)}
                alt={m.nick}
                className="mt-0.5 h-7 w-7 rounded-full bg-surface object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = dicebear(m.nick);
                }}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'font-mono text-xs',
                      m.nick === myNick ? 'text-primary' : 'text-foreground/80',
                    )}
                  >
                    @{m.nick}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatTime(m.createdAt)}
                  </span>
                </div>
                <p className="break-words text-sm text-foreground/90">
                  <MessageText text={m.text} myNick={myNick} />
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="border-t border-border/50 px-5 py-3">
        {isLoggedIn ? (
          <div className="relative">
            {mentionOpen && (
              <ul className="absolute bottom-full left-0 mb-2 w-56 overflow-hidden rounded-xl border border-border/60 bg-background shadow-card">
                {suggestions.map((f, i) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(f.nick);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                        i === highlighted ? 'bg-surface' : 'hover:bg-surface/60',
                      )}
                    >
                      <img
                        src={dicebear(f.nick)}
                        alt={f.nick}
                        className="h-5 w-5 rounded-full bg-surface"
                      />
                      <span className="font-mono text-xs">@{f.nick}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                onKeyDown={onKeyDown}
                placeholder="Message… use @ to mention a friend"
                maxLength={500}
                className="h-9 w-full rounded-lg border border-border/60 bg-surface px-3 text-sm focus:border-primary/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={sending || !draft.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition disabled:opacity-40"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
          </div>
        ) : (
          <p className="py-1 text-center text-sm text-muted-foreground">
            <Link to="/signin" className="text-primary hover:underline">
              Sign in
            </Link>{' '}
            to join the chat.
          </p>
        )}
      </footer>
    </section>
  );
}
