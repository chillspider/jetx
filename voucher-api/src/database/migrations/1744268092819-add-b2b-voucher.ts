import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddB2bVoucher1744268092819 implements MigrationInterface {
  name = 'AddB2bVoucher1744268092819';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "b2b_vouchers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "name" character varying NOT NULL, "description" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "code_quantity" integer NOT NULL, "voucher_name" character varying NOT NULL, "voucher_description" character varying, "percentage" bigint NOT NULL DEFAULT '0', "start_at" TIMESTAMP WITH TIME ZONE, "end_at" TIMESTAMP WITH TIME ZONE, "location" jsonb DEFAULT '{}', "validity" jsonb DEFAULT '{}', "nflow_id" character varying, CONSTRAINT "PK_48581f1709991966379a07e9351" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "b2b_voucher_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "code" character varying NOT NULL, "b2b_voucher_id" uuid NOT NULL, "voucher_id" uuid, "status" character varying NOT NULL DEFAULT 'available', "redeemed_at" TIMESTAMP, "redeemed_by" uuid, CONSTRAINT "UQ_438661ec17966dc67ba0a553f04" UNIQUE ("code"), CONSTRAINT "PK_112a7666e9d183b82751ba1afaf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "issue_type" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "b2b_voucher_codes" ADD CONSTRAINT "FK_ec560a3a08f862a5a03e69f817e" FOREIGN KEY ("b2b_voucher_id") REFERENCES "b2b_vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "b2b_voucher_codes" DROP CONSTRAINT "FK_ec560a3a08f862a5a03e69f817e"`,
    );
    await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "issue_type"`);
    await queryRunner.query(`DROP TABLE "b2b_voucher_codes"`);
    await queryRunner.query(`DROP TABLE "b2b_vouchers"`);
  }
}
