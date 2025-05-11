import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDevice1722321894992 implements MigrationInterface {
  name = 'UpdateDevice1722321894992';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "configs"`);
    await queryRunner.query(
      `ALTER TABLE "devices" ADD "device_no" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "device_no"`);
    await queryRunner.query(`ALTER TABLE "devices" ADD "configs" jsonb`);
  }
}
