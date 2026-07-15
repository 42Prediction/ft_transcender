import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import type { TransportTargetOptions } from 'pino';
import type { Request } from 'express';

export function buildPinoParams(config: ConfigService): Params {
  const level = config.get<string>('LOG_LEVEL') ?? 'info';
  const logFile = config.get<string>('LOG_FILE');
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  const targets: TransportTargetOptions[] = [];

  if (isProduction) {
    targets.push({ target: 'pino/file', level, options: { destination: 1 } });
  } else {
    targets.push({
      target: 'pino-pretty',
      level,
      options: { singleLine: true, translateTime: 'SYS:standard' },
    });
  }

  if (logFile) {
    targets.push({
      target: 'pino/file',
      level,
      options: { destination: logFile, mkdir: true },
    });
  }

  return {
    pinoHttp: {
      level,
      transport: { targets },
      customProps: (req: Request) => ({
        userId: (req as Request & { user?: { id?: string } }).user?.id ?? null,
      }),
      redact: {
        paths: [
          'req.headers.cookie',
          'req.headers.authorization',
          'res.headers["set-cookie"]',
          'req.body.password',
        ],
        remove: true,
      },
    },
  };
}
