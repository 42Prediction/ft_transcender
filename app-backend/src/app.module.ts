import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BettorModule } from './modules/bettor/bettor.module';
import { MarketModule } from './modules/market/market.module';
import { School42Module } from './modules/school42/school42.module';
import { MetricsModule } from './observability/metrics.module';
import { buildPinoParams } from './observability/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildPinoParams,
    }),
    MetricsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        // In containers we run pending migrations on boot (RUN_MIGRATIONS=true);
        // local dev keeps using `npm run migration:run` / `make migrate-run`.
        migrationsRun: config.get<string>('RUN_MIGRATIONS') === 'true',
      }),
    }),
    UserModule,
    AuthModule,
    BettorModule,
    MarketModule,
    School42Module,
  ],
})
export class AppModule {}
