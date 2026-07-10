import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import type { TransportTargetOptions } from 'pino';
import type { Request } from 'express';

/**
 * Builds the nestjs-pino configuration.
 *
 * Output strategy (chosen so the ELK stack has a stable ingestion point):
 * - In production the backend emits newline-delimited JSON, both to stdout
 *   (captured by Docker) and to `LOG_FILE`. Logstash tails that file, so logs
 *   survive Logstash restarts and stay decoupled from the app process.
 * - In development we render human-friendly pretty logs to stdout instead.
 *
 * Sensitive request data (cookies, auth headers, passwords) is stripped before
 * anything is written.
 */
export function buildPinoParams(config: ConfigService): Params {
  const level = config.get<string>('LOG_LEVEL') ?? 'info';
  const logFile = config.get<string>('LOG_FILE');
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  const targets: TransportTargetOptions[] = [];

  if (isProduction) {
    // Structured JSON to stdout (destination 1).
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
      // Attach the authenticated user id (set by JwtAuthGuard) when present.
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
