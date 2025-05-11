import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultToUserTokens1728616211981 implements MigrationInterface {
  name = 'AddDefaultToUserTokens1728616211981';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_tokens" ADD "is_default" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_tokens" DROP COLUMN "is_default"`,
    );
  }
}
