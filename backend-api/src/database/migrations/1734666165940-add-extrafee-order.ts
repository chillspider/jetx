import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtrafeeOrder1734666165940 implements MigrationInterface {
  name = 'AddExtrafeeOrder1734666165940';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD "extra_fee" bigint`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "parent_id" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "parent_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "extra_fee"`);
  }
}
