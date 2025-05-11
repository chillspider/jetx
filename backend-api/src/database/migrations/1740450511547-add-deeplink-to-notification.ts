import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeeplinkToNotification1740450511547
  implements MigrationInterface
{
  name = 'AddDeeplinkToNotification1740450511547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "deep_link" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "deep_link"`,
    );
  }
}
