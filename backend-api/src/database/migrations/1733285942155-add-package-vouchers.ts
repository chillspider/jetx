import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackageVouchers1733285942155 implements MigrationInterface {
  name = 'AddPackageVouchers1733285942155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "package_vouchers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "order_id" uuid NOT NULL, "package_id" character varying NOT NULL, "status" character varying NOT NULL, "station_ids" jsonb NOT NULL, "voucher" jsonb NOT NULL, "voucher_id" character varying, CONSTRAINT "PK_3b8b8b4e91ea009579905023e93" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "package_vouchers"`);
  }
}
