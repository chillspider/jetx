import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddValidityVoucher1734967942888 implements MigrationInterface {
  name = 'AddValidityVoucher1734967942888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "validity" jsonb DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "validity"`);
  }
}
