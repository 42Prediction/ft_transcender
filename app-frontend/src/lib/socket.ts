import { io, type Socket } from 'socket.io-client';

const defaultBaseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let marketSocket: Socket | null = null;

export function getMarketSocket(): Socket {
  if (!marketSocket) {
    marketSocket = io(`${defaultBaseURL}/market`, {
      withCredentials: true,
      autoConnect: true,
    });
  }
  return marketSocket;
}
