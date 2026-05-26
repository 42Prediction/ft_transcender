import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBettor1779547292059 implements MigrationInterface {
    name = 'CreateBettor1779547292059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bettors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nick" character varying(36) NOT NULL, "bio" text, "avatar" character varying NOT NULL, "is_nick_setted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "UQ_98c9710bc9170b93a3453e7605e" UNIQUE ("nick"), CONSTRAINT "REL_1785e6f33e7c8b7f815f961c45" UNIQUE ("user_id"), CONSTRAINT "PK_ec98d9bc5180b9231d5dc1c3c0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bettors" ADD CONSTRAINT "FK_1785e6f33e7c8b7f815f961c459" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettors" DROP CONSTRAINT "FK_1785e6f33e7c8b7f815f961c459"`);
        await queryRunner.query(`DROP TABLE "bettors"`);
    }

}
