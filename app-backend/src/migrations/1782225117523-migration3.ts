import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration31782225117523 implements MigrationInterface {
    name = 'Migration31782225117523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettors" ADD "campus" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettors" DROP COLUMN "campus"`);
    }

}
