import { useCallback, useEffect, useState } from 'react';
import { getMarketSocket } from '@/lib/socket';

export interface ChatMessage {
  id: string;
  marketId: string;
  bettorId: string;
  nick: string;
  avatar: string | null;
  text: string;
  createdAt: string;
}

const CHAT_HISTORY_LIMIT = 50;

/**
 * Joins the market's chat room over the shared /market socket. The join ack
 * carries the rolling history; `chat:message` keeps it live. Rejoins
 * transparently after a socket reconnect.
 */
export function useMarketChat(marketId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!marketId) return;
    const socket = getMarketSocket();

    const handleMessage = (msg: ChatMessage) => {
      if (msg.marketId !== marketId) return;
      setMessages((prev) => [...prev, msg].slice(-CHAT_HISTORY_LIMIT));
    };

    const join = () => {
      socket.emit('chat:join', marketId, (res: { messages?: ChatMessage[] } | undefined) => {
        setMessages(res?.messages ?? []);
      });
    };

    socket.on('chat:message', handleMessage);
    socket.on('connect', join);
    if (socket.connected) join();

    return () => {
      socket.emit('chat:leave', marketId);
      socket.off('chat:message', handleMessage);
      socket.off('connect', join);
    };
  }, [marketId]);

  const sendMessage = useCallback(
    (text: string) =>
      new Promise<{ error?: string }>((resolve) => {
        if (!marketId) return resolve({ error: 'No market.' });
        getMarketSocket().emit(
          'chat:send',
          { marketId, text },
          (res: { error?: string } | undefined) => resolve(res ?? {}),
        );
      }),
    [marketId],
  );

  return { messages, sendMessage };
}
