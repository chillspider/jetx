import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransaction1722172772272 implements MigrationInterface {
  name = 'AddTransaction1722172772272';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "order_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "order_id" uuid NOT NULL, "transaction_id" character varying NOT NULL, "status" character varying NOT NULL, "amount" bigint NOT NULL DEFAULT '0', "payment_method" character varying, "payment_provider" character varying, "data" json, "increment_id" SERIAL NOT NULL, CONSTRAINT "PK_a3f432d56165e5acafd5fb17cb3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_transaction_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "type" character varying NOT NULL, "payment_method" character varying NOT NULL, "payment_provider" character varying NOT NULL, "transaction_type" character varying, "order_id" character varying, "order_increment_id" integer, "order_transaction_id" character varying, "transaction_id" character varying, "request_id" character varying, "data" json NOT NULL DEFAULT '{}', "header" json NOT NULL DEFAULT '{}', "params" json NOT NULL DEFAULT '{}', CONSTRAINT "PK_70dd03d0d51de1f9cc3577f3777" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_transaction_logs"`);
    await queryRunner.query(`DROP TABLE "order_transactions"`);
  }
}
