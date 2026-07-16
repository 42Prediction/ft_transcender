import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const cors = {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    };
    return super.createIOServer(port, { ...options, cors });
  }
}
