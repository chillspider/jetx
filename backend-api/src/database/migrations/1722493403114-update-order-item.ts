import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderItem1722493403114 implements MigrationInterface {
  name = 'UpdateOrderItem1722493403114';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "product_size_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "product_size_name"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "product_size_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "product_size_id" character varying`,
    );
  }
}
