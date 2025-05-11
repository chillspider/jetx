import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNflowId1728378756355 implements MigrationInterface {
  name = 'AddNflowId1728378756355';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "nflow_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_transactions" ADD "nflow_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "nflow_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "nflow_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "nflow_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "nflow_id"`);
    await queryRunner.query(
      `ALTER TABLE "order_transactions" DROP COLUMN "nflow_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nflow_id"`);
  }
}
