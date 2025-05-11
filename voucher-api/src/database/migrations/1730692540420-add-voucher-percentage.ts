import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoucherPercentage1730692540420 implements MigrationInterface {
  name = 'AddVoucherPercentage1730692540420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "percentage" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "nflow_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "nflow_id"`);
    await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "percentage"`);
  }
}
