import { MigrationInterface, QueryRunner } from 'typeorm';

export class BriefModel1791133857412 implements MigrationInterface {
  name = 'BriefModel1791133857412';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_application" ADD "shortlisted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_goal_enum" AS ENUM('launch', 'traffic', 'followers', 'event')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "goal" "public"."orders_goal_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_platform_enum" AS ENUM('instagram', 'tiktok', 'youtube')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "platform" "public"."orders_platform_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "formats" text`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "city" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "languages" text`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "budgetMin" integer`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "budgetMax" integer`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "deliverables" text`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "postBy" date`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "publishedAt" TIMESTAMP WITH TIME ZONE`,
    );
    // Carry the old terms over: the budget becomes the whole range, an ISO
    // deadline becomes the post-by date (free text is dropped).
    await queryRunner.query(
      `UPDATE "orders" SET "budgetMin" = "budget", "budgetMax" = "budget"`,
    );
    await queryRunner.query(
      `UPDATE "orders" SET "postBy" = substring("deadline" from 1 for 10)::date WHERE "deadline" ~ '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])'`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "budget"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "deadline"`);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "description" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "category" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "requirements" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2b21d8086193c56faafaf1b97" ON "chat" ("senderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8115f44238b93aebb3a7290a11" ON "chat" ("recipientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_619bc7b78eba833d2044153bac" ON "message" ("chatId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_95d111049d6b03281a00441b5c" ON "order_application" ("applicantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c2d89d6aeb25ba9582ecfc6d1" ON "orders" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98acd6dec74c373ed4e4ab80f5" ON "orders" ("influencer_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_98acd6dec74c373ed4e4ab80f5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5c2d89d6aeb25ba9582ecfc6d1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_95d111049d6b03281a00441b5c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_619bc7b78eba833d2044153bac"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8115f44238b93aebb3a7290a11"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c2b21d8086193c56faafaf1b97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'open'`,
    );
    // Drafts may hold NULLs the old schema forbids.
    await queryRunner.query(
      `UPDATE "orders" SET "requirements" = COALESCE("requirements", ''), "category" = COALESCE("category", ''), "description" = COALESCE("description", '')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "requirements" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "category" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "description" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "deadline" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "budget" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE "orders" SET "budget" = COALESCE("budgetMax", 0), "deadline" = COALESCE("postBy"::text, '')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "deadline" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "budget" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "publishedAt"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "postBy"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "deliverables"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "budgetMax"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "budgetMin"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "languages"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "formats"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "platform"`);
    await queryRunner.query(`DROP TYPE "public"."orders_platform_enum"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "goal"`);
    await queryRunner.query(`DROP TYPE "public"."orders_goal_enum"`);
    await queryRunner.query(
      `ALTER TABLE "order_application" DROP COLUMN "shortlisted"`,
    );
  }
}
