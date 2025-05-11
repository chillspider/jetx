import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateModes1729478273815 implements MigrationInterface {
  name = 'UpdateModes1729478273815';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "modes" DROP CONSTRAINT "FK_c96a9f6b93073d29ba087a4d79e"`,
    );
    await queryRunner.query(`ALTER TABLE "modes" DROP COLUMN "price"`);
    await queryRunner.query(`ALTER TABLE "modes" DROP COLUMN "device_id"`);
    await queryRunner.query(`ALTER TABLE "modes" ADD "product_id" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "modes" DROP COLUMN "product_id"`);
    await queryRunner.query(
      `ALTER TABLE "modes" ADD "device_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "modes" ADD "price" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "modes" ADD CONSTRAINT "FK_c96a9f6b93073d29ba087a4d79e" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
