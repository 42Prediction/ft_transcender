import { config } from 'dotenv';
config();

import { AppDataSource } from '../data-source';
import { seedExamRanks } from './examrank.seed';

async function runSeeds(){

    await AppDataSource.initialize();
    await seedExamRanks(AppDataSource);

    await AppDataSource.destroy();
    console.log('Seeds concluídos!');
}

runSeeds().catch((err) => {
    console.error('Erro ao correr seeds:', err);
    process.exit(1);
});
