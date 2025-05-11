import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsageDurationPackageVouchers1733384629609
  implements MigrationInterface
{
  name = 'AddUsageDurationPackageVouchers1733384629609';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_vouchers" ADD "usage_duration" integer NOT NULL DEFAULT '60'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_vouchers" DROP COLUMN "usage_duration"`,
    );
  }
}
