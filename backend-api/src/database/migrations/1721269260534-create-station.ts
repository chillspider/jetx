import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStation1721269260534 implements MigrationInterface {
  name = 'CreateStation1721269260534';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "station_locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "station_id" uuid NOT NULL, "city" character varying NOT NULL, "city_id" character varying NOT NULL, "district" character varying NOT NULL, "district_id" character varying NOT NULL, "ward" character varying NOT NULL, "ward_id" character varying NOT NULL, "address" character varying, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, CONSTRAINT "REL_b19f1378bfdad819049ca6fa0a" UNIQUE ("station_id"), CONSTRAINT "PK_258491b791c06b4d69c34b71a25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "name" character varying NOT NULL, "description" character varying, "status" character varying NOT NULL DEFAULT 'active', "feature_image_url" character varying, "images" jsonb, "tags" jsonb, CONSTRAINT "PK_f047974bd453c85b08bab349367" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_locations" ADD CONSTRAINT "FK_b19f1378bfdad819049ca6fa0a8" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "station_locations" DROP CONSTRAINT "FK_b19f1378bfdad819049ca6fa0a8"`,
    );
    await queryRunner.query(`DROP TABLE "stations"`);
    await queryRunner.query(`DROP TABLE "station_locations"`);
  }
}
