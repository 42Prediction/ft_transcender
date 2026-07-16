import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDailyStreakToBettor1783508769132 implements MigrationInterface {
    name = 'AddDailyStreakToBettor1783508769132'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettors" ADD "daily_streak" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "bettors" ADD "last_daily_claim_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettors" DROP COLUMN "last_daily_claim_at"`);
        await queryRunner.query(`ALTER TABLE "bettors" DROP COLUMN "daily_streak"`);
    }

}
