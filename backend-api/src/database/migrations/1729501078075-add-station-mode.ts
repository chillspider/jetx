import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStationMode1729501078075 implements MigrationInterface {
  name = 'AddStationMode1729501078075';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "station_modes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "station_id" uuid NOT NULL, "mode_id" uuid NOT NULL, "price" bigint NOT NULL DEFAULT '0', CONSTRAINT "PK_a0a9203c2ac76c6cacfb5e8b594" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_modes" ADD CONSTRAINT "FK_f97f0ad8b619fbd9b871ba029e3" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_modes" ADD CONSTRAINT "FK_5643d4f8eedf7a42e6562b87d5e" FOREIGN KEY ("mode_id") REFERENCES "modes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "station_modes" DROP CONSTRAINT "FK_5643d4f8eedf7a42e6562b87d5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_modes" DROP CONSTRAINT "FK_f97f0ad8b619fbd9b871ba029e3"`,
    );
    await queryRunner.query(`DROP TABLE "station_modes"`);
  }
}
