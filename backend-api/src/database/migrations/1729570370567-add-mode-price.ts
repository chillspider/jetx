import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModePrice1729570370567 implements MigrationInterface {
  name = 'AddModePrice1729570370567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "modes" ADD "price" bigint NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "modes" DROP COLUMN "price"`);
  }
}
