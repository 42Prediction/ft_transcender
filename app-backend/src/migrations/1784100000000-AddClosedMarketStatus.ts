import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClosedMarketStatus1784100000000 implements MigrationInterface {
    name = 'AddClosedMarketStatus1784100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."markets_status_enum" RENAME TO "markets_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."markets_status_enum" AS ENUM('live', 'closing', 'closed', 'new', 'resolved', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" TYPE "public"."markets_status_enum" USING "status"::"text"::"public"."markets_status_enum"`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" SET DEFAULT 'new'`);
        await queryRunner.query(`DROP TYPE "public"."markets_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Fold any 'closed' rows back into 'closing' so the narrower enum accepts them.
        await queryRunner.query(`UPDATE "markets" SET "status" = 'closing' WHERE "status" = 'closed'`);
        await queryRunner.query(`CREATE TYPE "public"."markets_status_enum_old" AS ENUM('live', 'closing', 'new', 'resolved', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" TYPE "public"."markets_status_enum_old" USING "status"::"text"::"public"."markets_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" SET DEFAULT 'new'`);
        await queryRunner.query(`DROP TYPE "public"."markets_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."markets_status_enum_old" RENAME TO "markets_status_enum"`);
    }

}
