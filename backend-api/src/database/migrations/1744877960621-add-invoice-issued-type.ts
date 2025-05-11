import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoiceIssuedType1744877960621 implements MigrationInterface {
  name = 'AddInvoiceIssuedType1744877960621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "issued_type" character varying NOT NULL DEFAULT 'order'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "issued_type"`);
  }
}
