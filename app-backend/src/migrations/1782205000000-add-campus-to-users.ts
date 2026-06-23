import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCampusToUsers1782205000000 implements MigrationInterface {
    name = 'AddCampusToUsers1782205000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "campus" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "campus"`);
    }
}