import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancelledMarketStatus1782923773760 implements MigrationInterface {
    name = 'AddCancelledMarketStatus1782923773760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."markets_status_enum" RENAME TO "markets_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."markets_status_enum" AS ENUM('live', 'closing', 'new', 'resolved', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" TYPE "public"."markets_status_enum" USING "status"::"text"::"public"."markets_status_enum"`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" SET DEFAULT 'new'`);
        await queryRunner.query(`DROP TYPE "public"."markets_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."markets_status_enum_old" AS ENUM('live', 'closing', 'new', 'resolved')`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" TYPE "public"."markets_status_enum_old" USING "status"::"text"::"public"."markets_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "status" SET DEFAULT 'new'`);
        await queryRunner.query(`DROP TYPE "public"."markets_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."markets_status_enum_old" RENAME TO "markets_status_enum"`);
    }

}
