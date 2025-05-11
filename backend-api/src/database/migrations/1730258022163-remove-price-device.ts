import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePriceDevice1730258022163 implements MigrationInterface {
  name = 'RemovePriceDevice1730258022163';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "price"`);
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "metadata"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD "metadata" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "devices" ADD "price" bigint NOT NULL DEFAULT '0'`,
    );
  }
}
