import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVoucher1723427521868 implements MigrationInterface {
  name = 'CreateVoucher1723427521868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vouchers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "name" character varying(200) NOT NULL, "description" character varying, "type" character varying NOT NULL DEFAULT 'washing_service', "profile_application" character varying NOT NULL DEFAULT 'washing_service', "voucher_model" character varying NOT NULL DEFAULT 'fixed_amount', "min_order_value" bigint NOT NULL DEFAULT '0', "max_deduction_value" bigint, "hidden_cash_value" bigint NOT NULL DEFAULT '0', "start_at" TIMESTAMP WITH TIME ZONE, "end_at" TIMESTAMP WITH TIME ZONE, "location" jsonb DEFAULT '{}', "status" character varying NOT NULL DEFAULT 'draft', "user_id" uuid, "order_id" uuid, CONSTRAINT "PK_ed1b7dd909a696560763acdbc04" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vouchers"`);
  }
}
