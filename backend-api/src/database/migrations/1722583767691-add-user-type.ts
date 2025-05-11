import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserType1722583767691 implements MigrationInterface {
  name = 'AddUserType1722583767691';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "type" character varying NOT NULL DEFAULT 'client'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "type"`);
  }
}
