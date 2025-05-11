import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDeviceLog1722933199019 implements MigrationInterface {
  name = 'UpdateDeviceLog1722933199019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_logs" DROP COLUMN "order_id"`);
    await queryRunner.query(
      `ALTER TABLE "device_logs" ADD "order_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_logs" DROP COLUMN "order_id"`);
    await queryRunner.query(`ALTER TABLE "device_logs" ADD "order_id" uuid`);
  }
}
