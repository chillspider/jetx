import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSyncLog1727769031264 implements MigrationInterface {
  name = 'AddSyncLog1727769031264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sync_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "object_id" uuid NOT NULL, "type" character varying NOT NULL, "action" character varying NOT NULL, "value" jsonb NOT NULL DEFAULT '{}', "synced" boolean NOT NULL DEFAULT false, "synced_at" TIMESTAMP, CONSTRAINT "PK_f441fe15484e077c80ddec89336" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sync_logs"`);
  }
}
