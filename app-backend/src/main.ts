import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { SocketIoAdapter } from './socket-io.adapter';

// TLS is enabled when SSL_KEY_PATH/SSL_CERT_PATH point to real files (set by
// docker-compose.yml for the containerized stack); local `make dev` leaves
// these unset and falls back to plain HTTP.
function getHttpsOptions() {
  const keyPath = process.env.SSL_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH;
  if (!keyPath || !certPath || !existsSync(keyPath) || !existsSync(certPath)) {
    return undefined;
  }
  return { key: readFileSync(keyPath), cert: readFileSync(certPath) };
}

async function bootstrap() {
  const httpsOptions = getHttpsOptions();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    ...(httpsOptions && { httpsOptions }),
  });

  app.useLogger(app.get(Logger));

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  app.useWebSocketAdapter(new SocketIoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
bootstrap();
