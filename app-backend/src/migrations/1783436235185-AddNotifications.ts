import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1783436235185 implements MigrationInterface {
    name = 'AddNotifications1783436235185'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('bet_resolved', 'bet_cancelled', 'chat_mention')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bettor_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "market_id" uuid, "data" jsonb, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_bettor_created" ON "notifications" ("bettor_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_d50906fa4a5cc6c4df39557269a" FOREIGN KEY ("bettor_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_d50906fa4a5cc6c4df39557269a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_bettor_created"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}
