import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExamIdToMarkets1782917607113 implements MigrationInterface {
    name = 'AddExamIdToMarkets1782917607113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "markets" ADD "exam_id" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_markets_exam_subject" ON "markets" ("exam_id", "subject_login") WHERE "exam_id" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_markets_exam_subject"`);
        await queryRunner.query(`ALTER TABLE "markets" DROP COLUMN "exam_id"`);
    }

}
