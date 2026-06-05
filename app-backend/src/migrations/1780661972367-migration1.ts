import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration11780661972367 implements MigrationInterface {
    name = 'Migration11780661972367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" text, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "state" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bettors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nick" character varying(36) NOT NULL, "bio" text, "avatar" character varying NOT NULL, "is_nick_setted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "UQ_98c9710bc9170b93a3453e7605e" UNIQUE ("nick"), CONSTRAINT "REL_1785e6f33e7c8b7f815f961c45" UNIQUE ("user_id"), CONSTRAINT "PK_ec98d9bc5180b9231d5dc1c3c0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bettor_friend_requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "bettor_friend_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."bettor_friend_requests_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "sender_id" uuid, "receiver_id" uuid, CONSTRAINT "PK_319794765c0245bbe4a1cc909d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bettor_friends" ("bettor_id" uuid NOT NULL, "friend_id" uuid NOT NULL, CONSTRAINT "PK_ae13be5c03d66141edc4503b9bd" PRIMARY KEY ("bettor_id", "friend_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_620ab547920a1ef8415b46bd81" ON "bettor_friends" ("bettor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4c8240cb0f9f10864a2f7b01c4" ON "bettor_friends" ("friend_id") `);
        await queryRunner.query(`ALTER TABLE "bettors" ADD CONSTRAINT "FK_1785e6f33e7c8b7f815f961c459" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bettor_friend_requests" ADD CONSTRAINT "FK_587ae59f60711b163bfa3a3303d" FOREIGN KEY ("sender_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bettor_friend_requests" ADD CONSTRAINT "FK_a513579a3a4479000d069b7ec9b" FOREIGN KEY ("receiver_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bettor_friends" ADD CONSTRAINT "FK_620ab547920a1ef8415b46bd812" FOREIGN KEY ("bettor_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "bettor_friends" ADD CONSTRAINT "FK_4c8240cb0f9f10864a2f7b01c45" FOREIGN KEY ("friend_id") REFERENCES "bettors"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bettor_friends" DROP CONSTRAINT "FK_4c8240cb0f9f10864a2f7b01c45"`);
        await queryRunner.query(`ALTER TABLE "bettor_friends" DROP CONSTRAINT "FK_620ab547920a1ef8415b46bd812"`);
        await queryRunner.query(`ALTER TABLE "bettor_friend_requests" DROP CONSTRAINT "FK_a513579a3a4479000d069b7ec9b"`);
        await queryRunner.query(`ALTER TABLE "bettor_friend_requests" DROP CONSTRAINT "FK_587ae59f60711b163bfa3a3303d"`);
        await queryRunner.query(`ALTER TABLE "bettors" DROP CONSTRAINT "FK_1785e6f33e7c8b7f815f961c459"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c8240cb0f9f10864a2f7b01c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_620ab547920a1ef8415b46bd81"`);
        await queryRunner.query(`DROP TABLE "bettor_friends"`);
        await queryRunner.query(`DROP TABLE "bettor_friend_requests"`);
        await queryRunner.query(`DROP TYPE "public"."bettor_friend_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "bettors"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
