import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrder1722228571287 implements MigrationInterface {
  name = 'AddOrder1722228571287';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "increment_id" SERIAL NOT NULL, "customer_id" character varying, "customer_name" character varying(200), "customer_email" character varying(200), "customer_phone" character varying(200), "note" character varying(500), "sub_total" bigint, "grand_total" bigint NOT NULL, "item_quantity" integer NOT NULL, "discount_amount" bigint NOT NULL DEFAULT '0', "tax_amount" bigint, "status" character varying NOT NULL, "discount_ids" jsonb NOT NULL DEFAULT '[]', "payment_method" character varying NOT NULL, "payment_provider" character varying, "data" jsonb DEFAULT '{}', CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "order_id" uuid NOT NULL, "product_id" character varying NOT NULL, "product_name" character varying(200) NOT NULL, "product_size_id" character varying, "product_size_name" character varying, "qty" integer, "origin_price" numeric NOT NULL DEFAULT '0', "price" numeric NOT NULL, "discount_amount" bigint, "discount_ids" jsonb NOT NULL DEFAULT '[]', "total" numeric NOT NULL, "tax_amount" numeric, "product_type" character varying DEFAULT 'washing', "data" jsonb DEFAULT '{}', CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
  }
}
