import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupport1728378804531 implements MigrationInterface {
  name = 'AddSupport1728378804531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "supports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "customer_id" uuid, "customer_email" character varying NOT NULL, "customer_name" character varying, "customer_phone" character varying, "order_id" character varying, "title" character varying(200), "content" character varying(500), "images" jsonb, "status" character varying NOT NULL DEFAULT 'open', "data" jsonb, "nflow_id" character varying, CONSTRAINT "PK_d8c2a7cbebc6494f00dda770105" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "supports"`);
  }
}
