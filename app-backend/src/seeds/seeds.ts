import { config } from 'dotenv';
config();

// Booting AppModule here also boots the schedulers; flag seed mode so the exam
// sync's startup hook doesn't kick off a ~90s 42-API sync that then fails with
// "Driver not Connected" once this short-lived script tears the DB down.
process.env.SEED_MODE = 'true';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AppDataSource } from '../data-source';
import { adminSeed } from './admin.seed';
import { BettorService } from '../modules/bettor/bettor.service';

async function runSeeds(){
    const app = await NestFactory.createApplicationContext(AppModule);
    const bettorService = app.get(BettorService);

    await AppDataSource.initialize();
    await adminSeed(AppDataSource, bettorService);

    await AppDataSource.destroy();
    await app.close();
    console.log('Seeds OK!');
}

runSeeds().catch((err) => {
    console.error('Error seeds:', err);
    process.exit(1);
});
