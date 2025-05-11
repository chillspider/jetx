import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationCampaign1737102549521
  implements MigrationInterface
{
  name = 'AddNotificationCampaign1737102549521';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "user_id" uuid NOT NULL, "notification_id" uuid NOT NULL, "is_read" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_0ffdf4698be172c2a80b28992d5" UNIQUE ("user_id", "notification_id"), CONSTRAINT "PK_569622b0fd6e6ab3661de985a2b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "name" character varying NOT NULL, "notify_content" character varying, "email_content" character varying, "target_users" jsonb DEFAULT '[]', "schedule_time" TIMESTAMP, "status" character varying NOT NULL DEFAULT 'activated', "channel" character varying NOT NULL DEFAULT 'app_push', "reach" integer NOT NULL DEFAULT '0', "nflow_id" character varying, CONSTRAINT "PK_6bd3e0649c6f3fb8caa63dd39ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "campaign_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "target" character varying NOT NULL DEFAULT 'specific'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "channel" character varying NOT NULL DEFAULT 'app_push'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "is_read" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_944431ae979397c8b56a99bf024" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_944431ae979397c8b56a99bf024"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "is_read" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "channel"`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "target"`);
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "campaign_id"`,
    );
    await queryRunner.query(`DROP TABLE "notification_campaigns"`);
    await queryRunner.query(`DROP TABLE "user_notifications"`);
  }
}
