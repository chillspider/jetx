import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMembership1723443929164 implements MigrationInterface {
  name = 'UpdateMembership1723443929164';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "cost"`);
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP COLUMN "cost_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD "type" character varying DEFAULT 'basic'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_memberships" ADD "condition" jsonb DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_memberships" DROP COLUMN "condition"`,
    );
    await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "type"`);
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD "cost_type" character varying NOT NULL DEFAULT 'percent'`,
    );
    await queryRunner.query(`ALTER TABLE "memberships" ADD "cost" bigint`);
  }
}
