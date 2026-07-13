import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyMarketCategoriesToExamRank1782928648573 implements MigrationInterface {
    name = 'SimplifyMarketCategoriesToExamRank1782928648573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "category" TYPE text USING "category"::text`);
        await queryRunner.query(`DROP TYPE "public"."markets_category_enum"`);

        await queryRunner.query(`
            DELETE FROM "market_positions"
            WHERE "market_id" IN (
                SELECT "id" FROM "markets" WHERE "project" !~* 'rank\\s*0*[2-6]\\M'
            )
        `);
        await queryRunner.query(`DELETE FROM "markets" WHERE "project" !~* 'rank\\s*0*[2-6]\\M'`);

        await queryRunner.query(`
            UPDATE "markets"
            SET "category" = 'Exam ' || lpad((regexp_match("project", 'rank\\s*0*([2-6])', 'i'))[1], 2, '0')
        `);

        await queryRunner.query(`CREATE TYPE "public"."markets_category_enum" AS ENUM('Exam 02', 'Exam 03', 'Exam 04', 'Exam 05', 'Exam 06')`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "category" TYPE "public"."markets_category_enum" USING "category"::"public"."markets_category_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "category" TYPE text USING "category"::text`);
        await queryRunner.query(`DROP TYPE "public"."markets_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."markets_category_enum" AS ENUM('Common Core', 'Exams', 'Rushes', 'Piscine', 'Projects', 'Internships', 'Peer Evals')`);
        await queryRunner.query(`ALTER TABLE "markets" ALTER COLUMN "category" TYPE "public"."markets_category_enum" USING 'Exams'::"public"."markets_category_enum"`);
    }

}
