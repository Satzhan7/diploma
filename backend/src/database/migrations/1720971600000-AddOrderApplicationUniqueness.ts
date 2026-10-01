import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderApplicationUniqueness1720971600000
  implements MigrationInterface
{
  name = 'AddOrderApplicationUniqueness1720971600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_order_application_order_applicant"
      ON "order_application" ("orderId", "applicantId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_order_application_order_applicant"`,
    );
  }
}
