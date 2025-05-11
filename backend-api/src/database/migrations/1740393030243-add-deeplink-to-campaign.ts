import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeeplinkToCampaign1740393030243 implements MigrationInterface {
  name = 'AddDeeplinkToCampaign1740393030243';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_campaigns" ADD "deep_link" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_campaigns" DROP COLUMN "deep_link"`,
    );
  }
}
