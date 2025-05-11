import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoices1727751518131 implements MigrationInterface {
  name = 'AddInvoices1727751518131';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invoice_billings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "code" character varying, "name" character varying, "billing_name" character varying, "phone" character varying, "email" character varying, "address" character varying, "invoice_id" character varying, CONSTRAINT "PK_29c27f016e7a8c65e16b0e4ad89" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "sku" character varying, "name" character varying, "price" numeric NOT NULL, "tax_rate" numeric NOT NULL, "unit" character varying NOT NULL, "discount_amount" numeric NOT NULL, "qty" integer NOT NULL, "invoice_id" uuid NOT NULL, CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "provider" character varying, "order_id" character varying NOT NULL, "order_increment_id" integer NOT NULL, "status" character varying DEFAULT 'draft', "issued_date" TIMESTAMP WITH TIME ZONE NOT NULL, "external_id" character varying, "total_amount" bigint NOT NULL, "discount_amount" bigint NOT NULL, "data" jsonb, "invoice_billing_id" uuid, CONSTRAINT "REL_35b519cf6fe9da6caf8ba66c1e" UNIQUE ("invoice_billing_id"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoice_providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "status" character varying NOT NULL DEFAULT 'inactive', "type" character varying NOT NULL DEFAULT 'EASY-INVOICE', "config" jsonb, CONSTRAINT "PK_73258d85953839274653c35b668" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_dc991d555664682cfe892eea2c1" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_35b519cf6fe9da6caf8ba66c1e8" FOREIGN KEY ("invoice_billing_id") REFERENCES "invoice_billings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_35b519cf6fe9da6caf8ba66c1e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_dc991d555664682cfe892eea2c1"`,
    );
    await queryRunner.query(`DROP TABLE "invoice_providers"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TABLE "invoice_items"`);
    await queryRunner.query(`DROP TABLE "invoice_billings"`);
  }
}
