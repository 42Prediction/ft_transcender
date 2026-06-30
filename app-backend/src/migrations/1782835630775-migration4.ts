import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration41782835630775 implements MigrationInterface {
    name = 'Migration41782835630775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_type_enum" AS ENUM('DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_status_enum" AS ENUM('COMPLETED', 'FAILED', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_wallet" uuid NOT NULL, "amount" numeric(18,2) NOT NULL, "type" "public"."transaction_type_enum" NOT NULL, "status" "public"."transaction_status_enum" NOT NULL, "balance_before" numeric(18,2) NOT NULL, "balance_after" numeric(18,2) NOT NULL, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "wallet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_bettor" uuid NOT NULL, "balance" numeric(18,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e2a03f9850610e451f9259c0d01" UNIQUE ("id_bettor"), CONSTRAINT "REL_e2a03f9850610e451f9259c0d0" UNIQUE ("id_bettor"), CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_65cbcd8282aa8e754bd3c34152b" FOREIGN KEY ("id_wallet") REFERENCES "wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "FK_e2a03f9850610e451f9259c0d01" FOREIGN KEY ("id_bettor") REFERENCES "bettors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "FK_e2a03f9850610e451f9259c0d01"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_65cbcd8282aa8e754bd3c34152b"`);
        await queryRunner.query(`DROP TABLE "wallet"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
    }

}
