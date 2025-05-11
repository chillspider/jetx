import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddB2bIncrement1744878977050 implements MigrationInterface {
  name = 'AddB2bIncrement1744878977050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "b2b_vouchers" ADD "increment_id" SERIAL NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "b2b_vouchers" DROP COLUMN "increment_id"`,
    );
  }
}
