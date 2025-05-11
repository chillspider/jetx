import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembership1723025530012 implements MigrationInterface {
  name = 'AddMembership1723025530012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "name" character varying NOT NULL, "description" character varying, "cost" bigint, "cost_type" character varying NOT NULL DEFAULT 'percent', "duration" integer NOT NULL DEFAULT '30', CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "status" character varying NOT NULL, "user_id" uuid NOT NULL, "membership_id" uuid NOT NULL, CONSTRAINT "PK_5da67bb31a58da5c021ed713860" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "discounts" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "membership" jsonb DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "membership_amount" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_memberships" ADD CONSTRAINT "FK_b369bfb0586d848e7f52f47d492" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_memberships" ADD CONSTRAINT "FK_12bfa040225db30fd3530569b5c" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_memberships" DROP CONSTRAINT "FK_12bfa040225db30fd3530569b5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_memberships" DROP CONSTRAINT "FK_b369bfb0586d848e7f52f47d492"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "membership_amount"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "membership"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "discounts"`);
    await queryRunner.query(`DROP TABLE "user_memberships"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
  }
}
