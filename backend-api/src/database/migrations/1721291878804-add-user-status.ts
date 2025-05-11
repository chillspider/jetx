import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatus1721291878804 implements MigrationInterface {
  name = 'AddUserStatus1721291878804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "status" character varying NOT NULL DEFAULT 'inactive'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
  }
}
