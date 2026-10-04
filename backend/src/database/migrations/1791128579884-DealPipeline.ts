import { MigrationInterface, QueryRunner } from 'typeorm';

export class DealPipeline1791128579884 implements MigrationInterface {
  name = 'DealPipeline1791128579884';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Match and Collaboration are replaced by deals (docs/adr/0001-deal-pipeline.md).
    // Production has never been deployed, so their rows are not migrated.
    await queryRunner.query(`DROP TABLE "collaboration"`);
    await queryRunner.query(`DROP TYPE "public"."collaboration_status_enum"`);
    await queryRunner.query(`DROP TABLE "match"`);
    await queryRunner.query(`DROP TYPE "public"."match_status_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."deals_status_enum" AS ENUM('active', 'proof_submitted', 'completed', 'disputed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "deals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "applicationId" uuid NOT NULL, "brandProfileId" uuid NOT NULL, "creatorProfileId" uuid NOT NULL, "agreedPrice" integer NOT NULL, "deliverables" text, "postBy" date, "status" "public"."deals_status_enum" NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_d77f7a7123240712a27e06cf06" UNIQUE ("applicationId"), CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d14b6ea63f0b4f053c164e80a7" ON "deals" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23ddf9f43f6e196e2a8f159500" ON "deals" ("brandProfileId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aae3a8a3e7642dc96108f27613" ON "deals" ("creatorProfileId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_d14b6ea63f0b4f053c164e80a74" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_d77f7a7123240712a27e06cf067" FOREIGN KEY ("applicationId") REFERENCES "order_application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_23ddf9f43f6e196e2a8f1595007" FOREIGN KEY ("brandProfileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_aae3a8a3e7642dc96108f276137" FOREIGN KEY ("creatorProfileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deals" DROP CONSTRAINT "FK_aae3a8a3e7642dc96108f276137"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" DROP CONSTRAINT "FK_23ddf9f43f6e196e2a8f1595007"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" DROP CONSTRAINT "FK_d77f7a7123240712a27e06cf067"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" DROP CONSTRAINT "FK_d14b6ea63f0b4f053c164e80a74"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aae3a8a3e7642dc96108f27613"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23ddf9f43f6e196e2a8f159500"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d14b6ea63f0b4f053c164e80a7"`,
    );
    await queryRunner.query(`DROP TABLE "deals"`);
    await queryRunner.query(`DROP TYPE "public"."deals_status_enum"`);
    // Recreate the removed tables exactly as the Baseline made them.
    await queryRunner.query(
      `CREATE TYPE "public"."match_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "match" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brandId" uuid NOT NULL, "influencerId" uuid NOT NULL, "name" character varying, "category" character varying, "startDate" TIMESTAMP WITH TIME ZONE, "endDate" TIMESTAMP WITH TIME ZONE, "status" "public"."match_status_enum" NOT NULL DEFAULT 'pending', "message" character varying, "metadata" jsonb, "stats" jsonb DEFAULT '{}', "engagementRate" integer NOT NULL DEFAULT '0', "conversionRate" integer NOT NULL DEFAULT '0', "clickThroughRate" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92b6c3a6631dd5b24a67c69f69d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collaboration_status_enum" AS ENUM('active', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "collaboration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brandId" uuid NOT NULL, "influencerId" uuid NOT NULL, "orderId" uuid, "status" "public"."collaboration_status_enum" NOT NULL DEFAULT 'active', "completionDate" TIMESTAMP, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_16651fd53e1fc690513e3346063" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" ADD CONSTRAINT "FK_bee1426e16473b32db844e75a66" FOREIGN KEY ("brandId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" ADD CONSTRAINT "FK_cae7aca02c3e2e7eeaf921c2141" FOREIGN KEY ("influencerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration" ADD CONSTRAINT "FK_cc3db2e7ab6769fac00b6a41724" FOREIGN KEY ("brandId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration" ADD CONSTRAINT "FK_a322aac4a7367fbe66f6a4c458a" FOREIGN KEY ("influencerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration" ADD CONSTRAINT "FK_fee719b9388e5c1679d02d3dc0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
