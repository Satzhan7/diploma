# 05 — Database Documentation

This document describes the persistence layer of AdPartners.kz. The schema is derived directly from the TypeORM entities registered in [backend/src/app.module.ts](../../backend/src/app.module.ts).

## Database overview

| Item | Value |
|---|---|
| Engine | PostgreSQL 14 (image `postgres:14-alpine`) |
| Local port | 5435 (host) → 5432 (container) — see [docker-compose.yml](../../docker-compose.yml) |
| Default database | `influencer_platform` (compose) / `diploma` (configuration default) |
| ORM | TypeORM 0.3 (`@nestjs/typeorm` 10) |
| Schema management | `synchronize: true` for non-production (`backend/src/config/configuration.ts:9`); two TypeORM migrations exist for chat-id remediation. |
| Driver | `pg` 8.14 |

In development, the schema is generated automatically from the entity definitions. In production, the team should disable `synchronize` and adopt explicit migrations.

## Tables / entities registered

The entities below are registered in `AppModule` and therefore generate tables on startup.

| Table | Entity class | Source |
|---|---|---|
| `users` | `User` | `backend/src/users/entities/user.entity.ts` |
| `profiles` | `Profile` | `backend/src/profiles/entities/profile.entity.ts` |
| `social_media` | `SocialMedia` | `backend/src/profiles/entities/social-media.entity.ts` |
| `orders` | `Order` | `backend/src/orders/entities/order.entity.ts` |
| `order_application` | `OrderApplication` | `backend/src/orders/entities/order-application.entity.ts` |
| `match` | `Match` | `backend/src/matching/entities/match.entity.ts` |
| `collaboration` | `Collaboration` | `backend/src/collaborations/entities/collaboration.entity.ts` |
| `chat` | `Chat` | `backend/src/chats/entities/chat.entity.ts` |
| `message` | `Message` | `backend/src/chats/entities/message.entity.ts` |

Two additional entities (`Brand`, `Influencer`) exist in source but are not registered in `AppModule.entities` — they are listed at the end of this document under "Unregistered entities".

## Feature-to-table summary

| Table / Entity | Purpose | Main fields | Related feature | Relationships | Notes |
|---|---|---|---|---|---|
| `users` (`User`) | Authenticated account with role and profile-level metadata | `id`, `email`, `password`, `role`, `name`, `firstName`, `lastName`, `refreshToken`, `categories[]`, `languages[]`, `industry`, `location`, `followers`, `engagementRate`, `activeOrders`, `totalSpent`, `avatarUrl`, `bio`, `description`, `isEmailVerified`, `createdAt`, `updatedAt` | Authentication, role-based access, directories | One-to-one Profile; one-to-many Order (as brand); one-to-many Match (as brand and as influencer); one-to-many Message (sent and received) | `password` and `refreshToken` are `@Exclude()`d from API responses. `engagementRate` is `decimal(4,4)`. `categories` and `languages` are `text[]` PostgreSQL arrays. |
| `profiles` (`Profile`) | Rich brand or influencer profile attached to a User | `id`, `displayName`, `bio`, `avatarUrl`, `websiteUrl`, `ageRange`, `gender`, `location`, `type` (enum), `companyName`, `industry`, `interests[]`, `categories[]`, `niches[]`, `socialMediaPlatforms[]`, `socialMediaHandles` (jsonb), `followersCount`, `demographics` (jsonb), `contentTypes[]`, `metrics` (jsonb), `languages[]`, `preferences` (jsonb), `isSubscribedToOrders`, `createdAt`, `updatedAt` | Profile management, recommendations, statistics | One-to-one User (`user_id` FK); one-to-many SocialMedia (cascade) | `type` enum: `brand`, `influencer`. `metrics` jsonb shape: `{ averageEngagementRate, averageViews, averageLikes, averageComments }`. `demographics` jsonb shape: `{ ageRanges[], genders[], locations[] }`. |
| `social_media` (`SocialMedia`) | Per-platform handle attached to a Profile | `id`, `type` (enum), `url`, `username`, `followers`, `createdAt`, `updatedAt` | Profile management | Many-to-one Profile | `type` enum: `instagram`, `tiktok`, `facebook`, `twitter`, `threads`, `linkedin`. |
| `orders` (`Order`) | Brand campaign that influencers can apply to | `id`, `title`, `description`, `budget`, `category`, `requirements`, `deadline` (string), `status` (enum), `brand_id` (FK), `influencer_id` (FK, nullable), `createdAt`, `updatedAt` | Order workflow | Many-to-one Profile (`brand_id`); many-to-one Profile (`influencer_id`, nullable); many-to-one User (`brandUser`); one-to-many OrderApplication (cascade) | `status` enum: `draft`, `open`, `in-progress`, `review`, `completed`, `cancelled`. Default `open`. `deadline` is stored as `varchar` not `date`. |
| `order_application` (`OrderApplication`) | Influencer's application to an order | `id`, `message`, `proposedPrice`, `status` (enum), `createdAt`, `updatedAt` | Order workflow | Many-to-one Order; many-to-one User (`applicant`) | `status` enum: `pending`, `accepted`, `rejected`, `withdrawn`. Default `pending`. |
| `match` (`Match`) | Pairing between a brand and an influencer | `id`, `brandId`, `influencerId`, `name`, `category`, `startDate`, `endDate`, `status` (enum), `message`, `metadata` (jsonb), `stats` (jsonb), `engagementRate`, `conversionRate`, `clickThroughRate`, `createdAt`, `updatedAt` | Matching, recommendations, statistics | Many-to-one User (`brand`); many-to-one User (`influencer`) | `status` enum: `pending`, `accepted`, `rejected`, `completed`. `stats` jsonb shape: `{ clicks, impressions, engagementRate, followerGrowth }`. |
| `collaboration` (`Collaboration`) | Active relationship between brand and influencer, optionally linked to an order | `id`, `brandId`, `influencerId`, `orderId` (nullable), `status` (enum), `completionDate`, `notes`, `createdAt`, `updatedAt` | Collaborations module | Many-to-one User (`brand`); many-to-one User (`influencer`); many-to-one Order (nullable) | `status` enum: `active`, `completed`, `cancelled`. Default `active`. |
| `chat` (`Chat`) | One-to-one conversation between two users | `id`, `unreadCount`, `createdAt`, `updatedAt` | Real-time messaging | Many-to-one User (`sender`); many-to-one User (`recipient`); one-to-many Message | `unreadCount` defaults to `0`. |
| `message` (`Message`) | Single message inside a Chat | `id`, `content`, `senderId` (FK), `recipientId` (FK), `chatId` (FK), `isRead`, `createdAt` | Real-time messaging | Many-to-one User (sender); many-to-one User (recipient); many-to-one Chat | `isRead` defaults to `false`. Maps the canonical `message` table; the previously parallel `messages/` module has been removed. |

## Field reference

The reference below lists every column for every registered entity. PK = primary key, FK = foreign key.

### `users`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `name` | varchar | No | — | Full name |
| `firstName` | varchar | Yes | — | |
| `lastName` | varchar | Yes | — | |
| `email` | varchar | No | — | Unique |
| `password` | varchar | No | — | bcrypt hash, `@Exclude()`d from API |
| `role` | enum | No | `influencer` | Values: `admin`, `brand`, `influencer` |
| `isEmailVerified` | boolean | No | `false` | |
| `refreshToken` | varchar | Yes | — | bcrypt-hashed, `@Exclude()`d |
| `avatarUrl` | varchar | Yes | — | |
| `bio` | varchar | Yes | — | |
| `followers` | int | Yes | — | |
| `engagementRate` | decimal(4,4) | Yes | — | |
| `categories` | text[] | Yes | — | PostgreSQL array |
| `languages` | text[] | Yes | — | PostgreSQL array |
| `description` | varchar | Yes | — | |
| `industry` | varchar | Yes | — | |
| `location` | varchar | Yes | — | |
| `activeOrders` | int | Yes | — | |
| `totalSpent` | int | Yes | — | |
| `createdAt` | timestamp | No | `now()` | |
| `updatedAt` | timestamp | No | `now()` | |

### `profiles`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `displayName` | varchar | Yes | — | |
| `bio` | text | Yes | — | |
| `avatarUrl` | varchar | Yes | — | |
| `websiteUrl` | varchar | Yes | — | |
| `ageRange` | varchar | Yes | — | |
| `gender` | varchar | Yes | — | |
| `location` | varchar | Yes | — | |
| `type` | enum | No | `influencer` | Values: `brand`, `influencer` |
| `companyName` | varchar | Yes | — | Brand-specific |
| `industry` | varchar | Yes | — | |
| `interests` | simple-array | Yes | — | Comma-separated text |
| `categories` | simple-array | Yes | — | |
| `niches` | simple-array | Yes | — | Influencer-specific |
| `socialMediaPlatforms` | simple-array | Yes | — | |
| `socialMediaHandles` | jsonb | Yes | — | |
| `followersCount` | int | Yes | — | |
| `demographics` | jsonb | Yes | — | |
| `contentTypes` | simple-array | Yes | — | |
| `metrics` | jsonb | Yes | — | |
| `languages` | simple-array | Yes | — | |
| `preferences` | jsonb | Yes | — | |
| `isSubscribedToOrders` | boolean | No | `false` | |
| `user_id` | uuid | No | — | FK → `users.id` (one-to-one) |
| `createdAt` | timestamp | No | `now()` | |
| `updatedAt` | timestamp | No | `now()` | |

### `social_media`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `type` | enum | No | `instagram` | Values: `instagram`, `tiktok`, `facebook`, `twitter`, `threads`, `linkedin` |
| `url` | varchar | No | — | |
| `username` | varchar | Yes | — | |
| `followers` | int | Yes | — | |
| `profileId` | uuid | No | — | FK → `profiles.id` |
| `createdAt` | timestamp | No | `now()` | |
| `updatedAt` | timestamp | No | `now()` | |

### `orders`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `title` | varchar | No | — | |
| `description` | text | No | — | |
| `budget` | int | No | — | USD |
| `category` | varchar | No | — | |
| `requirements` | text | No | — | |
| `deadline` | varchar | No | — | Stored as ISO date string |
| `status` | enum | No | `open` | Values: `draft`, `open`, `in-progress`, `review`, `completed`, `cancelled` |
| `brand_id` | uuid | No | — | FK → `profiles.id` |
| `influencer_id` | uuid | Yes | — | FK → `profiles.id` |
| `brandUserId` | uuid | Yes | — | FK → `users.id` (additional join) |
| `createdAt` | timestamp | No | `now()` | |
| `updatedAt` | timestamp | No | `now()` | |

### `order_application`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `message` | text | No | — | |
| `proposedPrice` | int | Yes | — | |
| `status` | enum | No | `pending` | Values: `pending`, `accepted`, `rejected`, `withdrawn` |
| `orderId` | uuid | No | — | FK → `orders.id` |
| `applicantId` | uuid | No | — | FK → `users.id` |
| `createdAt` | timestamp | No | `now()` | |
| `updatedAt` | timestamp | No | `now()` | |

### `match`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `brandId` | uuid | No | — | FK → `users.id` |
| `influencerId` | uuid | No | — | FK → `users.id` |
| `name` | varchar | Yes | — | |
| `category` | varchar | Yes | — | |
| `startDate` | timestamptz | Yes | — | |
| `endDate` | timestamptz | Yes | — | |
| `status` | enum | No | `pending` | Values: `pending`, `accepted`, `rejected`, `completed` |
| `message` | varchar | Yes | — | |
| `metadata` | jsonb | Yes | — | |
| `stats` | jsonb | Yes | `{}` | `{ clicks, impressions, engagementRate, followerGrowth }` |
| `engagementRate` | int | No | `0` | |
| `conversionRate` | int | No | `0` | |
| `clickThroughRate` | int | No | `0` | |
| `createdAt` | timestamp | No | `now()` | |
| `updatedAt` | timestamp | No | `now()` | |

### `collaboration`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `brandId` | uuid | No | — | FK → `users.id` |
| `influencerId` | uuid | No | — | FK → `users.id` |
| `orderId` | uuid | Yes | — | FK → `orders.id` |
| `status` | enum | No | `active` | Values: `active`, `completed`, `cancelled` |
| `completionDate` | timestamp | Yes | — | |
| `notes` | text | Yes | — | |
| `createdAt` | timestamp | No | `now()` | |
| `updatedAt` | timestamp | No | `now()` | |

### `chat`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `senderId` | uuid | No | — | FK → `users.id` |
| `recipientId` | uuid | No | — | FK → `users.id` |
| `unreadCount` | int | No | `0` | |
| `createdAt` | timestamp | No | `now()` | |
| `updatedAt` | timestamp | No | `now()` | |

### `message`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `uuid_generate_v4()` | PK |
| `content` | text | No | — | |
| `senderId` | uuid | No | — | FK → `users.id` |
| `recipientId` | uuid | No | — | FK → `users.id` |
| `chatId` | uuid | No | — | FK → `chat.id` (added by migration `1745086101543`) |
| `isRead` | boolean | No | `false` | |
| `createdAt` | timestamp | No | `now()` | |

## Relationships diagram (textual)

```
User 1───1 Profile
Profile 1───* SocialMedia

User 1───* Order            (as brand, via Profile.brand)
Profile 1───* Order          (as brand, via brand_id)
Profile 0..1───* Order       (as influencer, via influencer_id)
Order 1───* OrderApplication (cascade)
User 1───* OrderApplication  (as applicant)

User 1───* Match              (as brand)
User 1───* Match              (as influencer)

User 1───* Collaboration      (as brand)
User 1───* Collaboration      (as influencer)
Order 0..1───* Collaboration  (optional link)

User 1───* Chat               (as sender)
User 1───* Chat               (as recipient)
Chat 1───* Message
User 1───* Message            (as sender)
User 1───* Message            (as recipient)
```

A graphical Mermaid version is provided in [04_TECHNICAL_DOCUMENTATION.md](./04_TECHNICAL_DOCUMENTATION.md#er-diagram).

## CRUD operations per entity

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| `User` | `POST /users`, `POST /auth/register` | `GET /users`, `GET /users/:id`, `GET /users/influencers`, `GET /users/brands` | `PATCH /users/:id` | `DELETE /users/:id`, `DELETE /auth/account` |
| `Profile` | Auto-created on register; `POST /profiles` | `GET /profiles/me`, `GET /profiles/:userId`, `GET /profiles`, `GET /profiles/influencers/search`, `GET /profiles/brands/search` | `PATCH /profiles/me`, `PUT /profiles/:id` | `DELETE /profiles/:id` |
| `SocialMedia` | Cascaded with Profile updates | Embedded in Profile responses | Cascaded with Profile updates | Cascaded with Profile updates |
| `Order` | `POST /orders` (brand only) | `GET /orders/available`, `GET /orders/brand`, `GET /orders/influencer`, `GET /orders/:id` | (no PATCH endpoint exposed; status changes go through application acceptance) | (no DELETE endpoint exposed) |
| `OrderApplication` | `POST /orders/:id/apply`, `POST /order-applications/:orderId` | `GET /order-applications`, `GET /order-applications/order/:orderId`, `GET /order-applications/:id` | `PATCH /order-applications/:id` | `DELETE /order-applications/:id` (withdraw, influencer only) |
| `Match` | `POST /matching` | `GET /matching`, `GET /matching/:id`, `GET /matching/user/matches`, `GET /matching/recommendations/influencers`, `GET /matching/recommendations/brands` | `PUT /matching/:id`, `PATCH /matching/:id/stats`, `PATCH /matching/:id/complete`, `POST /matching/:id/accept`, `POST /matching/:id/reject` | `DELETE /matching/:id` |
| `Collaboration` | `POST /collaborations` | `GET /collaborations` (admin), `GET /collaborations/brand`, `GET /collaborations/influencer`, `GET /collaborations/:id` | `PATCH /collaborations/:id` | `DELETE /collaborations/:id` (admin) |
| `Chat` | `POST /chats/:recipientId` | `GET /chats`, `GET /chats/:id`, `GET /chats/:id/messages` | `POST /chats/:id/read` | (no DELETE endpoint exposed) |
| `Message` | `POST /chats/:id/messages` (admin: `POST /chats/:id/messages/direct`) | `GET /chats/:id/messages` | (immutable; messages are append-only) | (no public delete; admin maintenance only) |

## Data validation rules (from DTOs)

| DTO | Field | Rule |
|---|---|---|
| `RegisterDto` | `email` | `@IsEmail()` |
| `RegisterDto` | `password` | `@IsString() @MinLength(6)` |
| `RegisterDto` | `name` | `@IsString()` |
| `RegisterDto` | `role` | `@IsEnum(UserRole)` |
| `LoginDto` | `email`, `password` | `@IsEmail()`, `@IsString()` |
| `CreateOrderDto` | `title` | `@IsString() @MinLength(3)` |
| `CreateOrderDto` | `description` | `@IsString() @MinLength(10)` |
| `CreateOrderDto` | `budget` | `@IsNumber() @Min(0)` |
| `CreateOrderDto` | `category`, `requirements` | `@IsString()` |
| `CreateOrderDto` | `deadline` | `@IsDateString()` |
| `CreateOrderApplicationDto` | `message` | `@IsString() @IsNotEmpty()` |
| `CreateOrderApplicationDto` | `proposedPrice` | `@IsNumber() @IsOptional()` |

The global `ValidationPipe` is registered in [backend/src/main.ts:14](../../backend/src/main.ts#L14), which means all decorators above are enforced for every incoming request body.

## Migration history

| Timestamp | Filename | Purpose |
|---|---|---|
| `1724111111111` | `FixChatMessages.ts` | Repair pre-existing messages whose `chatId` was `NULL` after a schema change. |
| `1745086101543` | `AddChatIdToMessages.ts` | Add the `chatId` column to the `message` table and back-fill it. |

Both migrations live in [backend/src/migrations/](../../backend/src/migrations/). The repository also contains companion SQL scripts (`add-recipient.sql`, `direct-fix.sql`, `fix-message-chatids.sql`) for manual remediation.

## Removed and future-work modules

| Module | Status |
|---|---|
| `backend/src/brands/` | Removed before final submission. The Brand entity duplicated the `User` + `Profile (type='brand')` flow used everywhere else and was never registered in the TypeORM `entities` list. |
| `backend/src/influencers/` | Future improvement. Reserved for a dedicated influencer-only domain; not implemented in the current submission. |
| `backend/src/messages/` | Removed before final submission. The official messaging stack is the `chats` module (REST + WebSocket); the legacy parallel module has been consolidated. |

## Possible improvements

| Area | Recommendation |
|---|---|
| Migrations | Disable `synchronize` in production and adopt versioned migrations only. |
| `deadline` column | Change from `varchar` to `date` to enable index-friendly range queries. |
| `Brand` table | Decide whether the entity is intentional. If yes, register it; if no, remove. |
| Indexes | Add indexes on `Order.category`, `Order.status`, `Match.brandId`, `Match.influencerId`, `Message.chatId`, and `Chat.senderId`/`recipientId` to improve dashboard and chat-listing performance. |
| Cascade rules | Add explicit `onDelete: 'CASCADE'` clauses on `Profile.user`, `OrderApplication.order`, `SocialMedia.profile`, and `Message.chat` to prevent orphaned rows. |
