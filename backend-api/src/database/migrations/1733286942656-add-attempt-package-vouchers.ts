import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttemptPackageVouchers1733286942656
  implements MigrationInterface
{
  name = 'AddAttemptPackageVouchers1733286942656';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_vouchers" ADD "attempt" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_vouchers" DROP COLUMN "attempt"`,
    );
  }
}
