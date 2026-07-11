import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration211783775293501 implements MigrationInterface {
    name = 'Migration211783775293501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "twoFactorSecret" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isTwoFactorEnabled" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isTwoFactorEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twoFactorSecret"`);
    }

}
