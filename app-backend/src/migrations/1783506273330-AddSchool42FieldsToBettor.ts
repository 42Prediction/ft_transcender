import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchool42FieldsToBettor1783506273330 implements MigrationInterface {
    name = 'AddSchool42FieldsToBettor1783506273330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettors" ADD "school42_login" character varying`);
        await queryRunner.query(`ALTER TABLE "bettors" ADD "school42_level" numeric(6,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettors" DROP COLUMN "school42_level"`);
        await queryRunner.query(`ALTER TABLE "bettors" DROP COLUMN "school42_login"`);
    }

}
