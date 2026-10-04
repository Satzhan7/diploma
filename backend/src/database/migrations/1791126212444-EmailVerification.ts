import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * R1b: sign-up email code. `users.isEmailVerified` (never set by the app)
 * becomes the `emailVerifiedAt` timestamp; every existing user counts as
 * verified, so nobody is locked out. One active code per user.
 */
export class EmailVerification1791126212444 implements MigrationInterface {
  name = 'EmailVerification1791126212444';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "emailVerifiedAt" = "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "isEmailVerified"`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "codeHash" character(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "REL_95b3bd492c85e471cd5e72277b" UNIQUE ("userId"), CONSTRAINT "PK_b985a8362d9dac51e3d6120d40e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification" ADD CONSTRAINT "FK_95b3bd492c85e471cd5e72277be" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_verification"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "isEmailVerified" = "emailVerifiedAt" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerifiedAt"`,
    );
  }
}
