import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferral1729671142723 implements MigrationInterface {
  name = 'AddReferral1729671142723';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "referral_id" uuid NOT NULL, "referred_id" uuid NOT NULL, "referral_code" character varying NOT NULL, CONSTRAINT "REL_507a2818bf5524662b068c2e81" UNIQUE ("referred_id"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "referral_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_baba1f2b1904abaa1ce3acd764a" FOREIGN KEY ("referral_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_507a2818bf5524662b068c2e81c" FOREIGN KEY ("referred_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_507a2818bf5524662b068c2e81c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_baba1f2b1904abaa1ce3acd764a"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referral_code"`);
    await queryRunner.query(`DROP TABLE "referrals"`);
  }
}
