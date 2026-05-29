# 06 — API Documentation

This document enumerates every HTTP route exposed by the AdPartners.kz NestJS backend and the WebSocket events emitted by the chat gateway. Every entry is sourced from a controller file in [backend/src/](../../backend/src/) and the corresponding DTO under `*/dto/`.

## Conventions

- **Base URL (development):** `http://localhost:3005`
- **Authentication:** Bearer JWT in the `Authorization` header (`Authorization: Bearer <accessToken>`).
- **JSON envelope:** Responses are JSON. The global `TransformInterceptor` ([backend/src/common/interceptors/transform.interceptor.ts](../../backend/src/common/interceptors/transform.interceptor.ts)) protects against circular references in serialized entities.
- **Validation errors:** The global `ValidationPipe` returns HTTP 400 with the standard NestJS validation envelope when DTO constraints fail.
- **Authorization errors:** `JwtAuthGuard` returns 401 when the token is missing or invalid; `RolesGuard` returns 403 when the role is not allowed.
- **Public endpoints** are marked with the `@Public()` decorator; all other endpoints require a valid JWT.
- **OpenAPI / Swagger UI** is exposed at `GET /docs` (configured in [backend/src/main.ts:21-28](../../backend/src/main.ts#L21-L28)).

---

## Auth (`/auth`)

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | Public | Register a brand or influencer; auto-creates a Profile of the matching type. | `RegisterDto` `{ name, email, password, role }` | `201 { user, accessToken, refreshToken }` | `400` invalid body; `409` email already exists |
| POST | `/auth/login` | Public | Issue access and refresh tokens for valid credentials. | `LoginDto` `{ email, password }` | `200 { user, accessToken, refreshToken }` | `401` invalid credentials |
| POST | `/auth/refresh` | Public | Exchange a valid refresh token for a new pair. | `{ refreshToken: string }` | `200 { accessToken, refreshToken }` | `401` invalid or revoked token |
| GET | `/auth/profile` | Authenticated | Return the user payload extracted from the JWT (with `sub`). | — | `200 { ...user }` | `401` no/invalid JWT |
| DELETE | `/auth/account` | Authenticated | Delete the authenticated user (and their Profile, if present). | — | `200 { message: "Account successfully deleted" }` | `401`; `404` user not found |

## Users (`/users`) — guarded by `JwtAuthGuard`

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| POST | `/users` | Authenticated | Administrative user creation. The standard sign-up path is `POST /auth/register`. | `CreateUserDto` | `201 User` | `400`, `401` |
| GET | `/users` | Authenticated | List all users. | — | `200 User[]` | `401` |
| GET | `/users/influencers` | Authenticated | List influencers; supports `?search=` and `?category=`. | — | `200 User[]` | `401` |
| GET | `/users/brands` | Authenticated | List brands; supports `?search=`. | — | `200 User[]` | `401` |
| GET | `/users/:id` | Authenticated | Fetch a user by id. | — | `200 User` | `401`, `404` |
| PATCH | `/users/:id` | Authenticated | Update a user. | `UpdateUserDto` | `200 User` | `400`, `401`, `404` |
| DELETE | `/users/:id` | Authenticated | Delete a user. | — | `200` | `401`, `404` |

## Profiles (`/profiles`) — guarded by `JwtAuthGuard`, `RolesGuard`

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| GET | `/profiles/me` | Authenticated | Return the current user's profile. | — | `200 Profile` | `401` |
| PATCH | `/profiles/me` | Authenticated | Update the current user's profile (and nested social media). | `UpdateProfileDto` | `200 Profile` | `400`, `401` |
| GET | `/profiles/:userId` | Authenticated | Return another user's profile by `userId`. | — | `200 Profile` | `401`, `404` |
| GET | `/profiles/influencers/search` | Brand | Search influencers with arbitrary `?key=value` filters. | — | `200 Profile[]` | `401`, `403` |
| GET | `/profiles/brands/search` | Influencer | Search brands with arbitrary `?key=value` filters. | — | `200 Profile[]` | `401`, `403` |
| GET | `/profiles` | Authenticated | List all profiles. | — | `200 Profile[]` | `401` |
| GET | `/profiles/:id` | Authenticated | Fetch a profile by profile id. | — | `200 Profile` | `401`, `404` |
| POST | `/profiles` | Authenticated | Create a profile (rarely used; profiles are created at registration). | `Partial<Profile>` | `201 Profile` | `400`, `401` |
| PUT | `/profiles/:id` | Authenticated | Replace a profile by id. | `UpdateProfileDto` | `200 Profile` | `400`, `401`, `404` |
| DELETE | `/profiles/:id` | Authenticated | Delete a profile. | — | `200` | `401`, `404` |

## Brands (`/brands`) — guarded by `JwtAuthGuard`

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| POST | `/brands` | Authenticated | Create a `Brand` row. | `CreateBrandDto` | `201 Brand` | `400`, `401` |
| GET | `/brands` | Authenticated | List all brands. | — | `200 Brand[]` | `401` |
| GET | `/brands/search?q=...` | Authenticated | Free-text brand search. | — | `200 Brand[]` | `401` |
| GET | `/brands/industry/:industry` | Authenticated | Filter by industry. | — | `200 Brand[]` | `401` |
| GET | `/brands/:id` | Authenticated | Fetch by id. | — | `200 Brand` | `401`, `404` |
| PATCH | `/brands/:id` | Authenticated | Update. | `UpdateBrandDto` | `200 Brand` | `400`, `401`, `404` |
| DELETE | `/brands/:id` | Authenticated | Delete. | — | `200` | `401`, `404` |

## Orders (`/orders`) — guarded by `JwtAuthGuard`, `RolesGuard`

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| POST | `/orders` | Brand | Create an order owned by the calling brand. | `CreateOrderDto` `{ title, description, budget, category, requirements, deadline }` | `201 Order` | `400`, `401`, `403` |
| GET | `/orders/available` | Influencer | List available orders. Optional `?category=`, `?minBudget=`, `?maxBudget=`. | — | `200 Order[]` | `401`, `403` |
| POST | `/orders/:id/apply` | Influencer | Quickly apply to an order without an application body. | — | `200 Order` | `401`, `403`, `404` |
| GET | `/orders/brand` | Brand | List orders owned by the calling brand. | — | `200 Order[]` | `401`, `403` |
| GET | `/orders/influencer` | Influencer | List orders the influencer is associated with. | — | `200 Order[]` | `401`, `403` |
| GET | `/orders/:id` | Authenticated | Fetch a single order. | — | `200 Order` | `401`, `404` |

## Order Applications (`/order-applications`) — guarded by `JwtAuthGuard`, `RolesGuard`

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| GET | `/order-applications` | Authenticated | List applications relevant to the current user (brand sees received, influencer sees sent). | — | `200 OrderApplication[]` | `401` |
| GET | `/order-applications/order/:orderId` | Brand | List applications for a specific order owned by the brand. | — | `200 OrderApplication[]` | `401`, `403`, `404` |
| POST | `/order-applications/:orderId` | Influencer | Submit an application with a cover letter and optional proposed price. | `CreateOrderApplicationDto` `{ message, proposedPrice? }` | `201 OrderApplication` | `400`, `401`, `403`, `404` |
| GET | `/order-applications/:id` | Authenticated | Fetch one application. | — | `200 OrderApplication` | `401`, `404` |
| PATCH | `/order-applications/:id` | Authenticated | Update an application (used by the brand to accept or reject). | `UpdateOrderApplicationDto` | `200 OrderApplication` | `400`, `401`, `403`, `404` |
| DELETE | `/order-applications/:id` | Influencer | Withdraw the influencer's own application. | — | `200 OrderApplication` | `401`, `403`, `404` |

## Collaborations (`/collaborations`) — guarded by `JwtAuthGuard`, `RolesGuard`

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| POST | `/collaborations` | Brand, Admin | Create a collaboration record. | `CreateCollaborationDto` `{ brandId, influencerId, orderId?, status?, notes? }` | `201 Collaboration` | `400`, `401`, `403` |
| GET | `/collaborations` | Admin | List all collaborations. | — | `200 Collaboration[]` | `401`, `403` |
| GET | `/collaborations/brand` | Brand | List collaborations belonging to the calling brand. | — | `200 Collaboration[]` | `401`, `403` |
| GET | `/collaborations/influencer` | Influencer | List collaborations belonging to the calling influencer. | — | `200 Collaboration[]` | `401`, `403` |
| GET | `/collaborations/:id` | Brand, Influencer, Admin | Fetch one. | — | `200 Collaboration` | `401`, `403`, `404` |
| PATCH | `/collaborations/:id` | Brand, Admin | Update one. | `UpdateCollaborationDto` | `200 Collaboration` | `400`, `401`, `403`, `404` |
| DELETE | `/collaborations/:id` | Admin | Delete one. | — | `200` | `401`, `403`, `404` |

## Matching (`/matching`) — guarded by `JwtAuthGuard`, `RolesGuard`

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| POST | `/matching` | Brand, Influencer | Create a match record. | `CreateMatchDto` | `201 Match` | `400`, `401`, `403` |
| GET | `/matching` | Brand, Influencer | List all matches. | — | `200 Match[]` | `401`, `403` |
| GET | `/matching/:id` | Brand, Influencer | Fetch one. | — | `200 Match` | `401`, `403`, `404` |
| PUT | `/matching/:id` | Brand, Influencer | Update one. | `UpdateMatchDto` | `200 Match` | `400`, `401`, `403`, `404` |
| DELETE | `/matching/:id` | Brand, Influencer | Delete one. | — | `200` | `401`, `403`, `404` |
| GET | `/matching/user/matches` | Brand, Influencer | List matches involving the calling user (as either party). | — | `200 Match[]` | `401`, `403` |
| PATCH | `/matching/:id/stats` | Brand, Influencer | Increment stats counters (`clicks`, `impressions`, `engagementRate`, `followerGrowth`). | `UpdateMatchStatsDto` | `200 Match` | `400`, `401`, `403`, `404` |
| PATCH | `/matching/:id/complete` | Brand | Transition an `accepted` match to `completed`. | — | `200 Match` | `400` if not accepted; `401`, `403`, `404` |
| GET | `/matching/recommendations/influencers` | Brand | Top-N recommended influencers for the calling brand. Optional `?limit=`. | — | `200 [{ user, matchScore }]` | `401`, `403` |
| GET | `/matching/recommendations/brands` | Influencer | Top-N recommended brands for the calling influencer. Optional `?limit=`. | — | `200 [{ user, matchScore }]` | `401`, `403` |
| POST | `/matching/:id/accept` | Brand, Influencer | Transition `pending → accepted`; auto-creates a chat between participants. | — | `200 Match` | `400` if not pending; `401`, `403`, `404` |
| POST | `/matching/:id/reject` | Brand, Influencer | Transition `pending → rejected`. | — | `200 Match` | `400` if not pending; `401`, `403`, `404` |
| POST | `/matching/calculate` | Brand, Influencer | Compute a match-score breakdown without persisting. | `{ brandId, influencerId }` | `200 { categoryMatch, audienceMatch, engagementScore, totalScore }` | `401`, `403`, `404` |

## Chats (`/chats`) — guarded by `JwtAuthGuard`

### Functional endpoints

| Method | Endpoint | Role | Purpose | Request body | Response | Errors |
|---|---|---|---|---|---|---|
| GET | `/chats` | Authenticated | List chats for the current user. | — | `200 Chat[]` | `401` |
| GET | `/chats/:id` | Authenticated | Fetch one chat (verifies access). | — | `200 Chat` | `401`, `403`, `404` |
| GET | `/chats/:id/messages` | Authenticated | Get messages of a chat. | — | `200 Message[]` | `401`, `403`, `404` |
| POST | `/chats/:recipientId` | Authenticated | Open or return existing chat with `recipientId`. | — | `201 Chat` | `400`, `401` |
| POST | `/chats/:id/messages` | Authenticated | Append a message; emits `newMessage` over WebSocket. | `{ content: string }` | `201 Message` | `400` empty content, `401`, `403`, `404` |
| POST | `/chats/:id/read` | Authenticated | Mark all messages in a chat as read. | — | `200 { success: true }` | `401`, `403`, `404` |

### Maintenance endpoints (admin-only, hidden from Swagger)

These endpoints exist to remediate the historical chat-id migration (see [05_DATABASE_DOCUMENTATION.md §Migration history](./05_DATABASE_DOCUMENTATION.md#migration-history)). They are **restricted to the `admin` role** via `RolesGuard` and are hidden from the public Swagger document via `@ApiExcludeEndpoint()`. They are not part of the production-facing API surface.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/chats/admin/debug-messages/:chatId` | Return raw `message` rows for a chat for diagnostic purposes. |
| POST | `/chats/admin/fix-messages` | Walk all messages with `chatId IS NULL` and link them to the matching chat by `(senderId, recipientId)`. |
| GET | `/chats/admin/fix-messages/sql` | Return the SQL the team can run manually against the database. |
| POST | `/chats/admin/messages/:chatId/direct` | Insert a message via raw SQL when the regular endpoint fails (workaround). |

## Categories (`/categories`) — guarded by `JwtAuthGuard`

The dashboards (`/brand/dashboard`, `/influencer/dashboard`) call this endpoint at load time to populate their category filters. The list is static and lives in [backend/src/categories/categories.controller.ts](../../backend/src/categories/categories.controller.ts).

| Method | Endpoint | Role | Purpose | Response |
|---|---|---|---|---|
| GET | `/categories` | Authenticated | Return the static array of supported content categories. | `200 string[]` |

## Statistics (`/statistics`) — guarded by `JwtAuthGuard`, `RolesGuard`

| Method | Endpoint | Role | Purpose | Query | Response |
|---|---|---|---|---|---|
| GET | `/statistics/brand` | Brand | Aggregated statistics for the calling brand. | `?startDate&endDate&influencerId&category` | `200 BrandDashboardStats` |
| GET | `/statistics/influencer` | Influencer | Aggregated statistics for the calling influencer. | `?startDate&endDate&brandId&category` | `200 InfluencerDashboardStats` |

The shape of the returned object includes totals (`totalMatches`, `totalClicks`, `totalImpressions`, `averageEngagementRate`, `totalFollowerGrowth`) and a `campaignStats` array used by the dashboard pie chart.

## App (`/`)

| Method | Endpoint | Role | Purpose | Response |
|---|---|---|---|---|
| GET | `/` | Public | Health-check style greeting. | `200 "Hello World!"` |
| GET | `/docs` | Public | Swagger UI. | HTML |

---

## WebSocket — Chats gateway

The Chats gateway is implemented in [backend/src/chats/chats.gateway.ts](../../backend/src/chats/chats.gateway.ts).

| Property | Value |
|---|---|
| Namespace | `/chats` |
| URL (development) | `ws://localhost:3005/chats` |
| Authentication | JWT in the connection handshake (`auth.token` or `Authorization: Bearer ...`). Connections without a valid token are immediately closed. |
| User mapping | Server-side `userId → socketId` and `socketId → userId` maps; users automatically join a personal room `user:{userId}` on connect. |

### Client → server events

| Event | Payload | Effect |
|---|---|---|
| `joinChat` | `chatId: string` | Joins the socket to room `chat:{chatId}`. |
| `leaveChat` | `chatId: string` | Leaves room `chat:{chatId}`. |

### Server → client events

| Event | Recipient | Payload |
|---|---|---|
| `newMessage` | All sockets in `chat:{chatId}` | The full `Message` plus a `chat: { id }` ref. |
| `chatUpdated` | The recipient's personal room `user:{recipientId}` | `{ chatId, unreadCount, lastMessage: { content, timestamp, isRead } }` |
| `messagesRead` | All sockets in `chat:{chatId}` | `{ chatId, userId }` |
| `newChat` | Both participants' personal rooms | The `Chat` object. |

---

## Authentication and authorization details

### Token format

Each token is a JWT signed with the `JWT_SECRET` env-var (or `super-secret` if unset — see [backend/src/config/configuration.ts](../../backend/src/config/configuration.ts)). The payload contains:

| Claim | Description |
|---|---|
| `sub` | The user's UUID. The server-side `JwtStrategy.validate()` re-loads the user from the database on every authenticated request and merges `sub` into the resulting object. |
| `email` | The user's email address. |
| `iat`, `exp` | Standard issued-at and expiry. Access tokens last 15 minutes; refresh tokens last 7 days. |

### Role enforcement

The `RolesGuard` reads the `@Roles(...)` metadata from the route or controller and compares the values against `request.user.role`. The role enum is:

| Code | Value |
|---|---|
| `UserRole.ADMIN` | `'admin'` |
| `UserRole.BRAND` | `'brand'` |
| `UserRole.INFLUENCER` | `'influencer'` |

If the route does not declare `@Roles(...)`, the guard returns `true` (no role check), which means a route protected only by `JwtAuthGuard` is accessible to all authenticated users regardless of role.

### Public endpoints

Endpoints decorated with `@Public()` ([backend/src/auth/decorators/public.decorator.ts](../../backend/src/auth/decorators/public.decorator.ts)) bypass `JwtAuthGuard`. The currently public endpoints are:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /` (root greeting)
- `GET /docs` (Swagger UI)

### Error response format

NestJS default. On a thrown `HttpException` the response is `{ statusCode, message, error }`. On a `ValidationPipe` failure the message is an array of validation error strings. Custom error envelopes are not configured.

## OpenAPI / Swagger UI

Swagger is enabled in [backend/src/main.ts:21-28](../../backend/src/main.ts#L21-L28):

```ts
const config = new DocumentBuilder()
  .setTitle('Influencer Platform API')
  .setDescription('The Influencer Platform API description')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
```

The interactive UI is reachable at `GET http://localhost:3005/docs`. It reflects the same endpoints documented above and can be used to obtain a JSON OpenAPI specification at `GET /docs-json` (NestJS default).
