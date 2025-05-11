import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeOrder1728621233212 implements MigrationInterface {
  name = 'AddTypeOrder1728621233212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "type" character varying NOT NULL DEFAULT 'default'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "type"`);
  }
}
