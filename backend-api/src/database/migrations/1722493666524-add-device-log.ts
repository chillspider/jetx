import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceLog1722493666524 implements MigrationInterface {
  name = 'AddDeviceLog1722493666524';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "device_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "type" character varying NOT NULL, "device_no" character varying NOT NULL, "order_id" uuid, "data" json NOT NULL DEFAULT '{}', "body" json NOT NULL DEFAULT '{}', CONSTRAINT "PK_16e38d55a3924c19dfb91dfc5ec" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "device_logs"`);
  }
}
