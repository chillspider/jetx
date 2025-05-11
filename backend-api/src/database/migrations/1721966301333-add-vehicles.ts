import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicles1721966301333 implements MigrationInterface {
  name = 'AddVehicles1721966301333';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "user_id" uuid NOT NULL, "brand" character varying, "model" character varying, "number_plate" character varying NOT NULL, "seat_count" integer NOT NULL DEFAULT '0', "color" character varying, "feature_image_url" character varying, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_88b36924d769e4df751bcfbf249" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_88b36924d769e4df751bcfbf249"`,
    );
    await queryRunner.query(`DROP TABLE "vehicles"`);
  }
}
