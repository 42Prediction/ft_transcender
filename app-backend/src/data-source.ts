import { DataSource } from "typeorm";
import { config } from "dotenv";
config({ path: "../.env" });

const dbPort = process.env.DB_PORT;

if (!dbPort) {
    throw new Error("DB_PORT environment variable is required");
}

const parsedDbPort = Number.parseInt(dbPort, 10);

if (Number.isNaN(parsedDbPort)) {
    throw new Error("DB_PORT must be a valid number");
}

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parsedDbPort,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: ['src/modules/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
});