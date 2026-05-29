# Repository Analysis Report — AdPartners.kz

**Project:** AdPartners.kz · **Team:** Innovators · **Students:** Kadir Satzhan, Abenov Aslan
**Supervisor:** Akhmetov Tolegen · **Programme:** 6B06102 — Computer Science · **University:** SDU University, Faculty of Engineering and Natural Sciences

This document is a technical audit of the project repository. It separates evidence into three categories so the supervisor and defense committee can verify which claims are sourced from the code itself, which from the prior diploma documentation, and which still require team confirmation.

---

## 1. Repository structure summary

```
diploma-main/
├── backend/                        NestJS 10 + TypeScript + TypeORM 0.3 + PostgreSQL 14
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/                        Application source
│   └── test/                       Jest test scaffolding (boilerplate only)
├── frontend/                       React 18 + TypeScript + Chakra UI + React Query
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   └── src/
├── src/                            Abandoned root-level prototype (54 lines total)
│   ├── matching/matching.service.ts
│   └── orders/orders.module.ts
├── docker-compose.yml              PostgreSQL (5435) + backend (3005)
├── package.json                    Stub root manifest (single dependency: react-icons)
├── README.md                       Empty
└── docs/diploma/                   Documentation set produced by this audit
```

## 2. Backend folder summary (`backend/src`)

| Folder | Purpose | Status |
|---|---|---|
| `app.module.ts`, `app.controller.ts`, `app.service.ts`, `main.ts` | Application bootstrap, global validation pipe, CORS, Swagger at `/docs`, `TransformInterceptor` for circular-reference safety. | Implemented |
| `auth/` | Registration, login, JWT issuance and refresh, account deletion, JWT strategy, `JwtAuthGuard`, `RolesGuard`, decorators (`@Public`, `@Roles`, `@GetCurrentUser`, `@GetUser`). | Implemented |
| `users/` | User entity, UsersService, UsersController (list, search by category for influencers, search by name for brands). | Implemented |
| `profiles/` | Profile entity (rich brand/influencer attributes), SocialMedia entity (Instagram, TikTok, Facebook, Twitter, Threads, LinkedIn), ProfilesService, ProfilesController. The controller exposes only `GET/PATCH /profiles/me`, role-gated influencer/brand search, and a read-only `GET /profiles/:userId`. Generic POST/PUT/DELETE were removed before submission. | Implemented |
| `orders/` | Order entity (with `OrderStatus` enum: draft, open, in-progress, review, completed, cancelled), OrderApplication entity (with `ApplicationStatus`), OrdersController, OrderApplicationsController, services. | Implemented |
| `collaborations/` | Collaboration entity (`CollaborationStatus`: active, completed, cancelled) linked to brand, influencer, optional Order. CRUD controller with role guards. | Implemented |
| `matching/` | Match entity, MatchingService (recommendation algorithm + deterministic match-score computation), MatchingController. All routes are JWT-guarded; per-match read/update/accept/reject/complete/stats verify the caller is a participant. Generic delete-by-id removed. | Implemented |
| `chats/` | Chat and Message entities, ChatsService, ChatsController, ChatsGateway (Socket.io, namespace `/chats`, JWT-authenticated). | Implemented |
| `categories/` | Static category endpoint (`GET /categories`, JWT-guarded) consumed by the brand and influencer dashboards. | Implemented. |
| `statistics/` | StatisticsService, StatisticsController (`/statistics/brand`, `/statistics/influencer`). Aggregates totals from Match.stats. | Partially implemented — daily time-series aggregation is a documented future improvement. |
| `common/interceptors/` | `TransformInterceptor` for safe response serialization. | Implemented |
| `config/configuration.ts` | Centralised env-var reader (port, DB, JWT). | Implemented |
| `migrations/` | `1724111111111-FixChatMessages.ts`, `1745086101543-AddChatIdToMessages.ts`. | Implemented |
| `scripts/` | Maintenance scripts: `create-missing-profiles.ts`, `add-recipient-to-messages.ts`, `fix-database.ts`, plus three SQL repair scripts. | Implemented (one-off utilities) |

## 3. Frontend folder summary (`frontend/src`)

| Folder | Purpose | Status |
|---|---|---|
| `App.tsx` | Top-level router, ProtectedRoute helper, ChakraProvider, QueryClient, AuthProvider. | Implemented |
| `index.tsx`, `index.css`, `theme.ts` | Bootstrap and Chakra theme overrides. | Implemented |
| `contexts/AuthContext.tsx` | Login, register, logout, `deleteAccount`, `refreshUser`, exposes `user`, `isAuthenticated`, `isLoading`. | Implemented |
| `services/` | Axios instance with bearer-token interceptor, plus active per-domain services: `api`, `applications`, `chats`, `collaborations`, `matching`, `orders`, `socket`, `statistics`, `users`. Inactive duplicates (`brands.ts`, `influencers.ts`, `match.ts`, `mockData.ts`) were removed before submission. | Implemented |
| `pages/` (top level) | `Landing`, `Login`, `Register`, `Profile`, `EditProfile`, `Messages`, `Matches`, `MatchDetail`, `Settings`. | Implemented |
| `pages/brand/` | `Dashboard`, `Orders`, `CreateOrder`, `InfluencerList`. Inactive demo screens (`Campaigns`, `Messages`, `Influencers`, `InfluencerRecommendations`, `MatchRecommendations`) were removed before submission — they were not routed in `App.tsx`. | Implemented |
| `pages/influencer/` | `Dashboard`, `Orders`, `OrderDetail`, `MyApplications`, `BrandList`, `BrandRecommendations`. | Implemented |
| `components/` | `DashboardLayout`, `Header`, `Logo`, `FilterSection`, `RangeFilter`, `InfluencerCard`, `LoadingSpinner`, `ChatWindow`, `UpdateStatsModal`, `IconWrapper`, `SearchIcon`, plus `auth/PublicRoute` and `statistics/{LineChart,PieChart,StatCard,StatsCard,StatsTable}`. | Implemented |
| `types/` | Shared TypeScript interfaces (User, Order, Match, etc.). | Implemented |

## 4. Important packages and dependencies

### Backend (`backend/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` | ^10.0.0 | NestJS framework |
| `@nestjs/typeorm` + `typeorm` + `pg` | ^10.0.1 / ^0.3.17 / ^8.14.1 | PostgreSQL ORM |
| `@nestjs/jwt` + `@nestjs/passport` + `passport`, `passport-jwt` | ^10.x | JWT authentication |
| `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` | ^10.x / ^4.7.2 | Real-time messaging |
| `@nestjs/swagger` + `swagger-ui-express` | ^8.1.1 | OpenAPI generation at `/docs` |
| `bcrypt` | ^5.1.1 | Password hashing |
| `class-validator`, `class-transformer` | ^0.14.1 / ^0.5.1 | DTO validation and serialization |
| `dotenv`, `@nestjs/config` | ^16.3.1 / ^3.1.1 | Environment configuration |

### Frontend (`frontend/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `react`, `react-dom` | ^18.2.0 | UI runtime |
| `react-router-dom` | ^6.22.0 | Routing |
| `@chakra-ui/react`, `@emotion/*`, `framer-motion` | ^2.8.2 / ^11 | UI library |
| `@tanstack/react-query` | ^5.17.19 | Server-state cache |
| `axios` | ^1.6.7 | HTTP client |
| `socket.io-client` | ^4.8.1 | Real-time chat client |
| `react-hook-form` | ^7.55.0 | Form handling |
| `recharts` | ^2.10.4 | Dashboard charts |
| `react-icons`, `@chakra-ui/icons` | ^5.5.0 | Iconography |

## 5. Frontend routes (confirmed from `frontend/src/App.tsx`)

| Path | Component | Access | Notes |
|---|---|---|---|
| `/` | `Landing` | Public | Auto-redirects authenticated users to their dashboard. |
| `/login` | `Login` | Public | Redirects authenticated users to `/`. |
| `/register` | `Register` | Public | Role selector (Brand or Influencer). |
| `/brand/dashboard` | `BrandDashboard` | Brand | KPIs, line chart, pie chart, stats table. |
| `/brand/orders` | `BrandOrders` | Brand | List of created orders with applicants modal. |
| `/brand/orders/create` | `CreateOrder` | Brand | Form: title, description, budget, category, requirements, deadline. |
| `/brand/influencers` | `InfluencerList` | Brand | Browse and filter influencers. |
| `/brand/messages` | `Messages` | Brand | Real-time chat. |
| `/brand/matches` | `Matches` | Brand | Match list. |
| `/brand/matches/:matchId` | `MatchDetail` | Brand | Match statistics and accept/reject. |
| `/brand/profile`, `/brand/profile/edit`, `/brand/profile/:userId` | `Profile`, `EditProfile` | Brand | Own and counterpart profiles. |
| `/brand/settings` | `Settings` | Brand | Notifications, language, account deletion. |
| `/influencer/dashboard` | `InfluencerDashboard` | Influencer | KPIs, charts, stats. |
| `/influencer/orders` | `Orders` | Influencer | Browse available orders. |
| `/influencer/orders/:orderId` | `OrderDetail` | Influencer | Order details, apply form. |
| `/influencer/applications` | `MyApplications` | Influencer | Tabs: pending / accepted / rejected / withdrawn. |
| `/influencer/brands` | `BrandList` | Influencer | Browse brands. |
| `/influencer/recommendations` | `BrandRecommendations` | Influencer | Recommended brands with match scores. |
| `/influencer/messages`, `/influencer/matches`, `/influencer/matches/:matchId`, `/influencer/profile*`, `/influencer/settings` | (shared) | Influencer | Same components as the brand-side equivalents. |
| `*` | `<div>404 Not Found</div>` | Public | Default route. |

## 6. Backend controllers (after demo-stabilisation cleanup)

| Controller | Route prefix | Guards | File |
|---|---|---|---|
| `AppController` | `/` | — | `backend/src/app.controller.ts` |
| `AuthController` | `/auth` | Mixed (`@Public()` on register/login/refresh; `JwtAuthGuard` on profile/account) | `backend/src/auth/auth.controller.ts` |
| `UsersController` | `/users` | `JwtAuthGuard` | `backend/src/users/users.controller.ts` |
| `ProfilesController` | `/profiles` | `JwtAuthGuard`, `RolesGuard` | `backend/src/profiles/profiles.controller.ts` |
| `OrdersController` | `/orders` | `JwtAuthGuard`, `RolesGuard` | `backend/src/orders/orders.controller.ts` |
| `OrderApplicationsController` | `/order-applications` | `JwtAuthGuard`, `RolesGuard` | `backend/src/orders/order-applications.controller.ts` |
| `CollaborationsController` | `/collaborations` | `JwtAuthGuard`, `RolesGuard` | `backend/src/collaborations/collaborations.controller.ts` |
| `MatchingController` | `/matching` | `JwtAuthGuard`, `RolesGuard` | `backend/src/matching/matching.controller.ts` |
| `ChatsController` | `/chats` | `JwtAuthGuard` | `backend/src/chats/chats.controller.ts` |
| `CategoriesController` | `/categories` | `JwtAuthGuard` | `backend/src/categories/categories.controller.ts` |
| `StatisticsController` | `/statistics` | `JwtAuthGuard`, `RolesGuard` | `backend/src/statistics/statistics.controller.ts` |

Full endpoint enumeration is provided in `06_API_DOCUMENTATION.md`.

## 7. Backend services found (12 active services)

`AppService`, `AuthService`, `UsersService`, `BrandsService`, `ProfilesService`, `OrdersService`, `OrderApplicationsService`, `CollaborationsService`, `MatchingService`, `ChatsService`, `StatisticsService`. The `InfluencersService` file exists but is empty.

## 8. DTOs / entities / models found

**Entities registered in `AppModule`** (TypeORM `synchronize:true` in non-production):

`User`, `Profile`, `SocialMedia`, `Order`, `OrderApplication`, `Match`, `Collaboration`, `Chat`, `Message` (one canonical mapping under `chats/`).

**Entities present in code but NOT registered:** `Brand` (`backend/src/brands/entities/brand.entity.ts`) — legacy.

**DTOs:** `RegisterDto`, `LoginDto`, `CreateUserDto`, `UpdateUserDto`, `CreateBrandDto`, `UpdateBrandDto`, `UpdateProfileDto` (with nested `SocialMediaDto`), `CreateOrderDto`, `UpdateOrderDto`, `CreateOrderApplicationDto`, `UpdateOrderApplicationDto`, `CreateCollaborationDto`, `UpdateCollaborationDto`, `CreateMatchDto`, `UpdateMatchDto`, `UpdateMatchStatsDto` (interface in `matching.service.ts`), `DailyStatDto`.

## 9. Database logic found

- TypeORM with PostgreSQL (`pg` driver).
- `synchronize: process.env.NODE_ENV !== 'production'` in `backend/src/config/configuration.ts:9` — schema is auto-derived from entities in development.
- Two migrations in `backend/src/migrations/`:
  - `1724111111111-FixChatMessages.ts`
  - `1745086101543-AddChatIdToMessages.ts`
- Manual SQL repair scripts in `backend/src/scripts/` (`add-recipient.sql`, `direct-fix.sql`, `fix-message-chatids.sql`).
- Maintenance TypeScript scripts: `create-missing-profiles.ts`, `add-recipient-to-messages.ts`, `fix-database.ts`.

## 10. Authentication logic found

- JWT access token (15 minutes) + refresh token (7 days, bcrypt-hashed before storage).
- Passport JWT strategy in `backend/src/auth/strategies/jwt.strategy.ts`.
- `JwtAuthGuard` honours the `@Public()` decorator (`backend/src/auth/decorators/public.decorator.ts`).
- `RolesGuard` reads `@Roles(...)` metadata via `Reflector` and compares against `user.role` (`backend/src/auth/guards/roles.guard.ts:9-21`).
- Token refresh validates the supplied refresh token against the bcrypt-hashed value stored on `User.refreshToken`.
- Frontend stores tokens in `localStorage`; an Axios response interceptor redirects to `/login` on 401. **Refresh-token rotation is not implemented on the frontend** — see `Future improvement`.

## 11. Chat / messaging logic found

- REST endpoints under `/chats` for chat creation, message retrieval, message creation (regular and `:id/messages/direct` workaround), read marking.
- Socket.io gateway in `backend/src/chats/chats.gateway.ts` namespaced under `/chats`, authenticated by JWT in the handshake. Maintains `userId → socketId` map and `chat:{id}` rooms.
- Events emitted: `newMessage`, `chatUpdated`, `messagesRead`, `newChat`.
- Frontend `frontend/src/services/socket.ts` connects to the namespace, joins/leaves chat rooms, and exposes `on/off` listeners.

## 12. Campaign / order logic found

- Brands create `Order` entities (title, description, budget, category, requirements, deadline). Status transitions: `draft → open → in-progress → review → completed | cancelled`.
- Influencers fetch available orders (filterable by category and budget range) and apply via `POST /orders/:id/apply` or `POST /order-applications/:orderId` (richer DTO with message and `proposedPrice`).
- Brand reviews applications and updates their status; influencer can withdraw (`DELETE /order-applications/:id`).
- The product term "Campaign" is used in user-facing copy; the implementation term is "Order".

## 13. Matching / recommendation logic found

- `MatchingService.calculateMatchScore` computes a fully deterministic weighted score (`categoryMatch × 0.4 + audienceMatch × 0.3 + engagementScore × 0.3`). `categoryMatch` is the Jaccard overlap of `Profile.categories`; `audienceMatch` is a 60/40 mix of `Profile.languages` and `Profile.contentTypes` Jaccard overlaps; `engagementScore` is `0.7 × User.engagementRate + 0.3 × min(User.followers/100000, 1)`. There are no random terms.
- `getRecommendedInfluencersForBrand` and `getRecommendedBrandsForInfluencer` filter out users with whom a Match already exists, score the remainder by category overlap, and return the top *N* (default 10).
- Match lifecycle: `pending → accepted | rejected → completed`.
- Acceptance auto-creates (or reuses) a chat between the two users via `ChatsService.create` and `ChatsService.addMessage` to seed an introductory message.

## 14. Statistics logic found

- `StatisticsService.getBrandStats` and `getInfluencerStats` aggregate `Match.stats` (clicks, impressions, follower growth) plus `engagementRate`. They support `startDate`, `endDate`, `category`, and counterpart-id filters.
- Daily-stat aggregation is marked `// TODO: Implement proper daily stats aggregation if needed` in `statistics.service.ts` — `Partially implemented`.

## 15. Unused / suspicious files

| Path | Observation | Status |
|---|---|---|
| (removed) root-level `src/matching/` and `src/orders/` | The 54-line abandoned prototype was deleted during the demo-stabilisation pass. | Resolved. |
| (removed) `backend/src/brands/` | Standalone Brand entity parallel to the User+Profile flow; never registered in `AppModule`'s TypeORM `entities` list. | Resolved — module deleted. |
| (removed) `backend/src/messages/` | Legacy parallel messaging module on the same `message` table. Superseded by the `chats` module. | Resolved — `MatchingService` and `OrderApplicationsService` now use `ChatsService`. |
| (removed) `frontend/src/services/match.ts` | Duplicate of `services/matching.ts`. | Resolved — consolidated into `matching.ts`. |
| (removed) `frontend/src/services/{brands,influencers,mockData}.ts` | Inactive — not imported anywhere. | Resolved — removed before submission. |
| (removed) `frontend/src/pages/brand/{Campaigns,Messages,Influencers,InfluencerRecommendations,MatchRecommendations}.tsx` | Not routed in `App.tsx`; never reachable from the running app. | Resolved — removed before submission. |
| `frontend/src/services/socket.ts` | WebSocket fallback now points at `http://localhost:3005`. | Resolved. |
| `backend/src/chats/chats.controller.ts` admin endpoints | Maintenance endpoints created to repair the historical chat-id migration. They now live under `/chats/admin/*`, are gated by `@Roles(UserRole.ADMIN)`, and are hidden from Swagger via `@ApiExcludeEndpoint()`. | Resolved. |

## 16. Missing documentation

Until this audit, the following were absent: README content for the project root and frontend; PRD; API reference; database schema documentation; technical architecture document; testing plan. All have been created in `docs/diploma/`.

## 17. Risks and recommendations

| Severity | Risk | Recommendation |
|---|---|---|
| High | TypeORM `synchronize: true` is active in non-production environments. Accidental run with `NODE_ENV` unset against a production database can drop columns. | Add an explicit `if (NODE_ENV === 'production') synchronize = false` guard and rely on migrations. |
| High | JWT secret default value `super-secret` in `configuration.ts:13` and `your-secret-key-change-in-production` in `docker-compose.yml`. | Replace with a strong secret in `.env`; never commit. |
| Medium | Frontend stores access and refresh tokens in `localStorage`; vulnerable to XSS. No refresh-token rotation. | Move refresh token to an HTTP-only cookie in a future iteration. |
| Medium | The recommendation **listing** endpoints (`GET /matching/recommendations/*`) currently rank only by `categoryMatch`, even though `calculateMatchScore` already produces a deterministic three-factor score. | Wire `calculateMatchScore` into the listing endpoints in a follow-up iteration. |
| Low | (Resolved) Maintenance endpoints moved under `/chats/admin/*`, restricted to `@Roles(UserRole.ADMIN)`, and excluded from Swagger via `@ApiExcludeEndpoint()`. |
| Low | Two existing test files (`backend/src/app.controller.spec.ts`, `frontend/src/App.test.tsx`) are NestJS/CRA boilerplate. | Add unit tests for at least the matching algorithm and the auth flow. |

---

## Confirmed from code

All sections 1–15 above. Every claim references a file path or file:line that the reader can open in the repository.

## Confirmed from existing documentation

The following are sourced from `Diplomaa docs/Innovators diploma1.pdf`:

- Project title, students, supervisor (Akhmetov Tolegen), Dean (Ramis Akhmedov), university (SDU), faculty (Engineering and Natural Sciences), course code (6B06102), defense year (2025).
- Abstracts in English, Kazakh (Аңдатпа), and Russian (Аннотация).
- Competitor list: Upfluence, AspireIQ, Influencity, Grin, Traackr.
- Citations: De Veirman et al. 2017; Brown & Hayes 2008; Influencer Marketing Hub 2023; Yessimova & Tulegenov 2021; Abdikarimova 2020; Kantar 2022.

## Inputs the team must supply or decide before submission

- **Team-role split** between Kadir Satzhan and Abenov Aslan (frontend / backend / design / documentation) — required for thesis Chapter 1.3.
- **Decision on Section 2.5 (user research)** — this project did not perform primary user research; the team should either omit the section or write a short note that requirements were derived from secondary research and competitor analysis.
- **Decision on legacy/parallel modules** — recommendations:
  - Remove the standalone `Brand` entity (not registered, dead code).
  - Remove or implement the empty `influencers` module shell.
- **Production deployment target** — no production hosting is currently set up; the team should either deploy before defense or note that the demo is local.

The following items, previously in this list, have been resolved during the documentation pass:

- Debug `/chats/...` endpoints are now restricted to the `admin` role and hidden from the public Swagger document.
- The `audienceMatch` factor of the recommendation score is now deterministic (Jaccard of language and content-type sets); see [04_TECHNICAL_DOCUMENTATION.md §11](./04_TECHNICAL_DOCUMENTATION.md).
- The `/users/settings` mismatch has been resolved by switching the Settings page to client-side `localStorage` persistence.
