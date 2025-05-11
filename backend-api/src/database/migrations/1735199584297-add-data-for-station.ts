import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataForStation1735199584297 implements MigrationInterface {
  name = 'AddDataForStation1735199584297';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stations" ADD "data" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "data"`);
  }
}
