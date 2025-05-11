import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStationIdToUsers1742797853555 implements MigrationInterface {
  name = 'AddStationIdToUsers1742797853555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "station_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "station_id"`);
  }
}
