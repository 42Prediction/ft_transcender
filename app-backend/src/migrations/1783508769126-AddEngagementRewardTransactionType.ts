import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEngagementRewardTransactionType1783508769126 implements MigrationInterface {
    name = 'AddEngagementRewardTransactionType1783508769126'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_type_enum" AS ENUM('DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT', 'COMMISSION', 'MARKET_SEED', 'SCHOOL42_REWARD', 'ENGAGEMENT_REWARD')`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "type" TYPE "public"."transaction_type_enum" USING "type"::"text"::"public"."transaction_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_type_enum_old" AS ENUM('DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT', 'COMMISSION', 'MARKET_SEED', 'SCHOOL42_REWARD')`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "type" TYPE "public"."transaction_type_enum_old" USING "type"::"text"::"public"."transaction_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_type_enum_old" RENAME TO "transaction_type_enum"`);
    }

}
