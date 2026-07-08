import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBettorQuests1783509382617 implements MigrationInterface {
    name = 'AddBettorQuests1783509382617'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bettor_quests" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "bettor_id" uuid NOT NULL,
            "quest_key" character varying NOT NULL,
            "reward" numeric(18,2) NOT NULL,
            "completed_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_bettor_quests" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_bettor_quest" ON "bettor_quests" ("bettor_id", "quest_key")`);
        await queryRunner.query(`ALTER TABLE "bettor_quests" ADD CONSTRAINT "FK_bettor_quests_bettor" FOREIGN KEY ("bettor_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettor_quests" DROP CONSTRAINT "FK_bettor_quests_bettor"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_bettor_quest"`);
        await queryRunner.query(`DROP TABLE "bettor_quests"`);
    }

}
