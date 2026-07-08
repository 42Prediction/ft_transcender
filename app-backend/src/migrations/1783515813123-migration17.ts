import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration171783515813123 implements MigrationInterface {
    name = 'Migration171783515813123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettor_quests" DROP CONSTRAINT "FK_bettor_quests_bettor"`);
        await queryRunner.query(`ALTER TABLE "bettor_quests" ADD CONSTRAINT "FK_4fc78e4f84ee3835f344dd885e0" FOREIGN KEY ("bettor_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettor_quests" DROP CONSTRAINT "FK_4fc78e4f84ee3835f344dd885e0"`);
        await queryRunner.query(`ALTER TABLE "bettor_quests" ADD CONSTRAINT "FK_bettor_quests_bettor" FOREIGN KEY ("bettor_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
