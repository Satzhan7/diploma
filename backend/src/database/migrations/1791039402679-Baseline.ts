import { MigrationInterface, QueryRunner } from 'typeorm';

// Baseline: the whole schema as of Phase 1 (generated from the entities in
// data-source.ts against an empty Postgres 14). Match and Collaboration are
// still here; Phase 2.3 drops them in a later migration.
export class Baseline1791039402679 implements MigrationInterface {
  name = 'Baseline1791039402679';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // uuid_generate_v4() defaults below.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."social_media_type_enum" AS ENUM('instagram', 'tiktok', 'facebook', 'twitter', 'threads', 'linkedin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "social_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."social_media_type_enum" NOT NULL DEFAULT 'instagram', "url" character varying NOT NULL, "username" character varying, "followers" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "profileId" uuid, CONSTRAINT "PK_54ac0fd97432069e7c9ab567f8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."profiles_type_enum" AS ENUM('brand', 'influencer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "displayName" character varying, "bio" text, "avatarUrl" character varying, "websiteUrl" character varying, "ageRange" character varying, "gender" character varying, "location" character varying, "type" "public"."profiles_type_enum" NOT NULL DEFAULT 'influencer', "companyName" character varying, "industry" character varying, "interests" text, "categories" text, "niches" text, "socialMediaPlatforms" text, "socialMediaHandles" jsonb, "followersCount" integer, "demographics" jsonb, "contentTypes" text, "metrics" jsonb, "languages" text, "preferences" jsonb, "isSubscribedToOrders" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_9e432b7df0d182f8d292902d1a" UNIQUE ("user_id"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unreadCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "senderId" uuid, "recipientId" uuid, CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "senderId" uuid NOT NULL, "recipientId" uuid NOT NULL, "chatId" uuid NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."match_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "match" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brandId" uuid NOT NULL, "influencerId" uuid NOT NULL, "name" character varying, "category" character varying, "startDate" TIMESTAMP WITH TIME ZONE, "endDate" TIMESTAMP WITH TIME ZONE, "status" "public"."match_status_enum" NOT NULL DEFAULT 'pending', "message" character varying, "metadata" jsonb, "stats" jsonb DEFAULT '{}', "engagementRate" integer NOT NULL DEFAULT '0', "conversionRate" integer NOT NULL DEFAULT '0', "clickThroughRate" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92b6c3a6631dd5b24a67c69f69d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'brand', 'influencer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "firstName" character varying, "lastName" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'influencer', "isEmailVerified" boolean NOT NULL DEFAULT false, "refreshToken" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "avatarUrl" character varying, "bio" character varying, "followers" integer, "engagementRate" numeric(4,4), "languages" text array, "description" character varying, "industry" character varying, "location" character varying, "activeOrders" integer, "totalSpent" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."order_application_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_application" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message" text NOT NULL, "proposedPrice" integer, "status" "public"."order_application_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "orderId" uuid, "applicantId" uuid, CONSTRAINT "UQ_order_application_order_applicant" UNIQUE ("orderId", "applicantId"), CONSTRAINT "PK_67e44c0c54624afb70e82c9c728" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('draft', 'open', 'in-progress', 'review', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "budget" integer NOT NULL, "category" character varying NOT NULL, "requirements" text NOT NULL, "deadline" character varying NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'open', "brand_id" uuid NOT NULL, "influencer_id" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collaboration_status_enum" AS ENUM('active', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "collaboration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brandId" uuid NOT NULL, "influencerId" uuid NOT NULL, "orderId" uuid, "status" "public"."collaboration_status_enum" NOT NULL DEFAULT 'active', "completionDate" TIMESTAMP, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_16651fd53e1fc690513e3346063" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_media" ADD CONSTRAINT "FK_81978bc1cd40723dee3e498cc0a" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ADD CONSTRAINT "FK_c2b21d8086193c56faafaf1b97c" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ADD CONSTRAINT "FK_8115f44238b93aebb3a7290a119" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_445b786f516688cf2b81b8981b6" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_619bc7b78eba833d2044153bacc" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" ADD CONSTRAINT "FK_bee1426e16473b32db844e75a66" FOREIGN KEY ("brandId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" ADD CONSTRAINT "FK_cae7aca02c3e2e7eeaf921c2141" FOREIGN KEY ("influencerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_application" ADD CONSTRAINT "FK_f1615bcbe4f47cef415404fbe93" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_application" ADD CONSTRAINT "FK_95d111049d6b03281a00441b5ca" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_5c2d89d6aeb25ba9582ecfc6d1d" FOREIGN KEY ("brand_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_98acd6dec74c373ed4e4ab80f50" FOREIGN KEY ("influencer_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collaboration" DROP CONSTRAINT "FK_fee719b9388e5c1679d02d3dc0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration" DROP CONSTRAINT "FK_a322aac4a7367fbe66f6a4c458a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaboration" DROP CONSTRAINT "FK_cc3db2e7ab6769fac00b6a41724"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_98acd6dec74c373ed4e4ab80f50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_5c2d89d6aeb25ba9582ecfc6d1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_application" DROP CONSTRAINT "FK_95d111049d6b03281a00441b5ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_application" DROP CONSTRAINT "FK_f1615bcbe4f47cef415404fbe93"`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" DROP CONSTRAINT "FK_cae7aca02c3e2e7eeaf921c2141"`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" DROP CONSTRAINT "FK_bee1426e16473b32db844e75a66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_619bc7b78eba833d2044153bacc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_445b786f516688cf2b81b8981b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" DROP CONSTRAINT "FK_8115f44238b93aebb3a7290a119"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" DROP CONSTRAINT "FK_c2b21d8086193c56faafaf1b97c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "social_media" DROP CONSTRAINT "FK_81978bc1cd40723dee3e498cc0a"`,
    );
    await queryRunner.query(`DROP TABLE "collaboration"`);
    await queryRunner.query(`DROP TYPE "public"."collaboration_status_enum"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "order_application"`);
    await queryRunner.query(
      `DROP TYPE "public"."order_application_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "match"`);
    await queryRunner.query(`DROP TYPE "public"."match_status_enum"`);
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(`DROP TABLE "chat"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TYPE "public"."profiles_type_enum"`);
    await queryRunner.query(`DROP TABLE "social_media"`);
    await queryRunner.query(`DROP TYPE "public"."social_media_type_enum"`);
  }
}
