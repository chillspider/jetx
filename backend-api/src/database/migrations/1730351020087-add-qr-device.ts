import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrDevice1730351020087 implements MigrationInterface {
  name = 'AddQrDevice1730351020087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" ADD "qr" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "qr"`);
  }
}
