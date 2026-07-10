import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExamEndsAtAndFinalGradeToMarket1783800000000 implements MigrationInterface {
    name = 'AddExamEndsAtAndFinalGradeToMarket1783800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "markets" ADD "exam_ends_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "markets" ADD "final_grade" numeric(6,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "markets" DROP COLUMN "final_grade"`);
        await queryRunner.query(`ALTER TABLE "markets" DROP COLUMN "exam_ends_at"`);
    }

}
