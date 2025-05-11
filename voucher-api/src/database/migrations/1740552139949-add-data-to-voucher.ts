import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataToVoucher1740552139949 implements MigrationInterface {
  name = 'AddDataToVoucher1740552139949';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "data" jsonb DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "data"`);
  }
}
