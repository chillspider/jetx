import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotification1723545961781 implements MigrationInterface {
  name = 'AddNotification1723545961781';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "title" character varying NOT NULL, "content" character varying, "user_id" uuid NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "type" character varying NOT NULL, "data" jsonb DEFAULT '{}', CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "device_tokens" jsonb DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "device_tokens"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
