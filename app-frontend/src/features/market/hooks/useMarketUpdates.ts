import { useEffect } from 'react';
import { getMarketSocket } from '@/lib/socket';
import type { MarketDto } from '@/api/market/market.api';

export function useMarketUpdates(
  onUpdate: (market: MarketDto) => void,
  onRemove: (marketId: string) => void,
) {
  useEffect(() => {
    const socket = getMarketSocket();

    socket.on('market:update', onUpdate);
    socket.on('market:removed', onRemove);

    return () => {
      socket.off('market:update', onUpdate);
      socket.off('market:removed', onRemove);
    };
  }, [onUpdate, onRemove]);
}
