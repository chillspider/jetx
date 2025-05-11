import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddYglIdToOrder1741937212922 implements MigrationInterface {
  name = 'AddYglIdToOrder1741937212922';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "ygl_order_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "ygl_order_id"`);
  }
}
