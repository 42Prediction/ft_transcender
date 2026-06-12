import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration21781027240999 implements MigrationInterface {
    name = 'Migration21781027240999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."friend_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "friend" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."friend_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "sender_id" uuid, "receiver_id" uuid, CONSTRAINT "UQ_3a787956e35e2ba362ad4bceabf" UNIQUE ("sender_id", "receiver_id"), CONSTRAINT "PK_1b301ac8ac5fcee876db96069b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "friend" ADD CONSTRAINT "FK_df4674c2a44afb524cdfc08b188" FOREIGN KEY ("sender_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend" ADD CONSTRAINT "FK_f380bca1596112662861a0e7ec7" FOREIGN KEY ("receiver_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "friend" DROP CONSTRAINT "FK_f380bca1596112662861a0e7ec7"`);
        await queryRunner.query(`ALTER TABLE "friend" DROP CONSTRAINT "FK_df4674c2a44afb524cdfc08b188"`);
        await queryRunner.query(`DROP TABLE "friend"`);
        await queryRunner.query(`DROP TYPE "public"."friend_status_enum"`);
    }

}
