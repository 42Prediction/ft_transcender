import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMarketSeedTransactionType1783504212388 implements MigrationInterface {
    name = 'AddMarketSeedTransactionType1783504212388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."transaction_type_enum" RENAME TO "transaction_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_type_enum" AS ENUM('DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT', 'COMMISSION', 'MARKET_SEED')`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "type" TYPE "public"."transaction_type_enum" USING "type"::"text"::"public"."transaction_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_type_enum_old" AS ENUM('DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT', 'COMMISSION')`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "type" TYPE "public"."transaction_type_enum_old" USING "type"::"text"::"public"."transaction_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_type_enum_old" RENAME TO "transaction_type_enum"`);
    }

}
