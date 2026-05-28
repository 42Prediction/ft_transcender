import { config } from 'dotenv';
config();

import { AppDataSource } from '../data-source';
import { adminSeed } from './admin.seed';

async function runSeeds(){

    await AppDataSource.initialize();
    await adminSeed(AppDataSource);

    await AppDataSource.destroy();
    console.log('Seeds OK!');
}

runSeeds().catch((err) => {
    console.error('Error seeds:', err);
    process.exit(1);
});
