import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttention1722247152876 implements MigrationInterface {
  name = 'AddAttention1722247152876';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "attentions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "name" character varying NOT NULL, "feature_image_url" character varying, "translations" jsonb NOT NULL, CONSTRAINT "PK_5fc7685d43671aa780297ac64e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "device_attentions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted_at" TIMESTAMP, "deleted_by" uuid, "device_id" uuid NOT NULL, "attention_id" uuid NOT NULL, CONSTRAINT "UQ_62057535732953346f4fa4380c5" UNIQUE ("device_id", "attention_id"), CONSTRAINT "PK_90479bb8c2048779686056ccf62" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_attentions" ADD CONSTRAINT "FK_4dc4842852e9858885ba7cd6a5d" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_attentions" ADD CONSTRAINT "FK_8c75b579e774125a6d285d1a406" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_attentions" DROP CONSTRAINT "FK_8c75b579e774125a6d285d1a406"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_attentions" DROP CONSTRAINT "FK_4dc4842852e9858885ba7cd6a5d"`,
    );
    await queryRunner.query(`DROP TABLE "device_attentions"`);
    await queryRunner.query(`DROP TABLE "attentions"`);
  }
}
