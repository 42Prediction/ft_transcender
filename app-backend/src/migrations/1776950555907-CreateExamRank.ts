import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExamRank1776950555907 implements MigrationInterface {
    name = 'CreateExamRank1776950555907'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "examrank" ("id" SERIAL NOT NULL, "name" character varying(20) NOT NULL, "min_score" integer NOT NULL, "max_score" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_01bfca385f89ef83b7713743db8" UNIQUE ("name"), CONSTRAINT "PK_566dccbfd315a99e4500b5ae0e6" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "examrank"`);
    }

}
