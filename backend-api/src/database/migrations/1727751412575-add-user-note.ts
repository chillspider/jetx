import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNote1727751412575 implements MigrationInterface {
  name = 'AddUserNote1727751412575';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "note" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "note"`);
  }
}
