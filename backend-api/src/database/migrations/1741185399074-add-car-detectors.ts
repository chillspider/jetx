import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCarDetectors1741185399074 implements MigrationInterface {
  name = 'AddCarDetectors1741185399074';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "car_detectors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "customer_id" uuid NOT NULL, "order_id" uuid NOT NULL, "image_url" character varying, "plate_number" character varying, "brand" character varying, "car_type" character varying, "color" character varying, "data" jsonb DEFAULT '{}', CONSTRAINT "PK_b30ac8716b16d128a03d43e2918" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "car_detectors"`);
  }
}
