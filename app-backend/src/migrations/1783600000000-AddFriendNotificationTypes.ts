import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFriendNotificationTypes1783600000000 implements MigrationInterface {
    name = 'AddFriendNotificationTypes1783600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'friend_request_received'`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'friend_request_accepted'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('bet_resolved', 'bet_cancelled', 'chat_mention')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::text::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
    }

}
