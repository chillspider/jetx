import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserToken1722259960215 implements MigrationInterface {
  name = 'AddUserToken1722259960215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "account_brand" character varying, "account_source" character varying, "account_number" character varying, "account_name" character varying, "token" character varying NOT NULL, "payment_provider" character varying NOT NULL, CONSTRAINT "PK_63764db9d9aaa4af33e07b2f4bf" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_tokens"`);
  }
}
