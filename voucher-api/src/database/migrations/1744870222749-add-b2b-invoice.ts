import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddB2bInvoice1744870222749 implements MigrationInterface {
  name = 'AddB2bInvoice1744870222749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "b2b_voucher_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "b2b_voucher_id" uuid NOT NULL, "code" character varying, "name" character varying, "billing_name" character varying, "address" character varying, "items" jsonb DEFAULT '[]', CONSTRAINT "REL_701e330d07bc8c85d80650dd72" UNIQUE ("b2b_voucher_id"), CONSTRAINT "PK_b8a2dd2fd7758f48d74b2425391" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "b2b_voucher_invoices" ADD CONSTRAINT "FK_701e330d07bc8c85d80650dd721" FOREIGN KEY ("b2b_voucher_id") REFERENCES "b2b_vouchers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "b2b_voucher_invoices" DROP CONSTRAINT "FK_701e330d07bc8c85d80650dd721"`,
    );
    await queryRunner.query(`DROP TABLE "b2b_voucher_invoices"`);
  }
}
