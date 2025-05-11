import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocations1721637766894 implements MigrationInterface {
  name = 'AddLocations1721637766894';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "wards" ("id" character varying NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "district_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f67afa72e02ac056570c0dde279" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "districts" ("id" character varying NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "city_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_972a72ff4e3bea5c7f43a2b98af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cities" ("id" character varying NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cities"`);
    await queryRunner.query(`DROP TABLE "districts"`);
    await queryRunner.query(`DROP TABLE "wards"`);
  }
}
