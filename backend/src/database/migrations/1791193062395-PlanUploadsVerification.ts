import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * R4: brand plans (`plan` + `proExpiresAt`; the effective plan is computed on
 * read), uploaded files, creator stats verification (`verifiedAt` is the
 * badge) and the admin audit log. Existing brands start on Free; nothing is
 * backfilled.
 */
export class PlanUploadsVerification1791193062395
  implements MigrationInterface
{
  name = 'PlanUploadsVerification1791193062395';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."files_kind_enum" AS ENUM('portfolio', 'verification')`,
    );
    await queryRunner.query(
      `CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "kind" "public"."files_kind_enum" NOT NULL, "mimeType" character varying(32) NOT NULL, "size" integer NOT NULL, "storageKey" character varying(64) NOT NULL, "position" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f734c17eff711279fdda38cc4ae" UNIQUE ("storageKey"), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a4f33c6381bf8aa9a6c24b5b62" ON "files" ("ownerId", "kind") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."creator_verifications_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "creator_verifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profileId" uuid NOT NULL, "followers" integer NOT NULL, "engagementRate" numeric(5,2) NOT NULL, "screenshotId" uuid, "status" "public"."creator_verifications_status_enum" NOT NULL DEFAULT 'pending', "rejectReason" character varying(500), "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "reviewedAt" TIMESTAMP WITH TIME ZONE, "reviewedById" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_8b4d9b8eeead8aaf324ae3e3fc" UNIQUE ("profileId"), CONSTRAINT "PK_6e6cba91f06b92922e3887446b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorId" uuid, "action" character varying(64) NOT NULL, "targetType" character varying(32) NOT NULL, "targetId" uuid NOT NULL, "details" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7c0cca6e6369db3a240aa4cf13" ON "audit_log" ("targetType", "targetId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."profiles_plan_enum" AS ENUM('free', 'pro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "plan" "public"."profiles_plan_enum" NOT NULL DEFAULT 'free'`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "proExpiresAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_a23484d1055e34d75b25f616792" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creator_verifications" ADD CONSTRAINT "FK_8b4d9b8eeead8aaf324ae3e3fc4" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creator_verifications" ADD CONSTRAINT "FK_bf31c0ad4d7a874038b67b0ce5d" FOREIGN KEY ("screenshotId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creator_verifications" ADD CONSTRAINT "FK_d2cabcfb6f0df61e1faa0874173" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log" ADD CONSTRAINT "FK_cb6aa6f6fd56f08eafb60316225" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_log" DROP CONSTRAINT "FK_cb6aa6f6fd56f08eafb60316225"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creator_verifications" DROP CONSTRAINT "FK_d2cabcfb6f0df61e1faa0874173"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creator_verifications" DROP CONSTRAINT "FK_bf31c0ad4d7a874038b67b0ce5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creator_verifications" DROP CONSTRAINT "FK_8b4d9b8eeead8aaf324ae3e3fc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_a23484d1055e34d75b25f616792"`,
    );
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "verifiedAt"`);
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP COLUMN "proExpiresAt"`,
    );
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "plan"`);
    await queryRunner.query(`DROP TYPE "public"."profiles_plan_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c0cca6e6369db3a240aa4cf13"`,
    );
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TABLE "creator_verifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."creator_verifications_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a4f33c6381bf8aa9a6c24b5b62"`,
    );
    await queryRunner.query(`DROP TABLE "files"`);
    await queryRunner.query(`DROP TYPE "public"."files_kind_enum"`);
  }
}
