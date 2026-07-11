import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration51782839712570 implements MigrationInterface {
    name = 'Migration51782839712570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."market_positions_side_enum" AS ENUM('YES', 'NO')`);
        await queryRunner.query(`CREATE TABLE "market_positions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "market_id" uuid NOT NULL, "bettor_id" uuid NOT NULL, "side" "public"."market_positions_side_enum" NOT NULL, "amount" numeric(18,2) NOT NULL, "shares" numeric(18,6) NOT NULL, "entry_price" numeric(18,6) NOT NULL, "payout" numeric(18,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_36d4f8ec6acf50f196d9f621105" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."markets_category_enum" AS ENUM('Common Core', 'Exams', 'Rushes', 'Piscine', 'Projects', 'Internships', 'Peer Evals')`);
        await queryRunner.query(`CREATE TYPE "public"."markets_status_enum" AS ENUM('live', 'closing', 'new', 'resolved')`);
        await queryRunner.query(`CREATE TYPE "public"."markets_resolution_enum" AS ENUM('YES', 'NO')`);
        await queryRunner.query(`CREATE TABLE "markets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subject_login" character varying NOT NULL, "subject_name" character varying NOT NULL, "subject_avatar" text, "project" character varying NOT NULL, "category" "public"."markets_category_enum" NOT NULL, "status" "public"."markets_status_enum" NOT NULL DEFAULT 'new', "yes_pool" numeric(18,2) NOT NULL DEFAULT '100', "no_pool" numeric(18,2) NOT NULL DEFAULT '100', "closes_at" TIMESTAMP NOT NULL, "resolved_at" TIMESTAMP, "resolution" "public"."markets_resolution_enum", "creator_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dda44129b32f21ae9f1c28dcf99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "market_positions" ADD CONSTRAINT "FK_69aa09918e8762ef4aedc93404d" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "market_positions" ADD CONSTRAINT "FK_01823a509a54f82955695de5c37" FOREIGN KEY ("bettor_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markets" ADD CONSTRAINT "FK_0e7e43c0c4ebfa703981d3e677d" FOREIGN KEY ("creator_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "markets" DROP CONSTRAINT "FK_0e7e43c0c4ebfa703981d3e677d"`);
        await queryRunner.query(`ALTER TABLE "market_positions" DROP CONSTRAINT "FK_01823a509a54f82955695de5c37"`);
        await queryRunner.query(`ALTER TABLE "market_positions" DROP CONSTRAINT "FK_69aa09918e8762ef4aedc93404d"`);
        await queryRunner.query(`DROP TABLE "markets"`);
        await queryRunner.query(`DROP TYPE "public"."markets_resolution_enum"`);
        await queryRunner.query(`DROP TYPE "public"."markets_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."markets_category_enum"`);
        await queryRunner.query(`DROP TABLE "market_positions"`);
        await queryRunner.query(`DROP TYPE "public"."market_positions_side_enum"`);
    }

}
