# AdPartners.kz

> Web platform connecting brands with local influencers in Kazakhstan and the CIS region.
> Bachelor diploma project — SDU University, Faculty of Engineering and Natural Sciences, course 6B06102 "Computer Science", 2025.
> Team **Innovators**: Kadir Satzhan and Abenov Aslan. Supervisor: Akhmetov Tolegen.

## Overview

AdPartners.kz is a full-stack web application that brings influencer-marketing discovery, negotiation, collaboration, and analytics into a single product targeted at the Kazakh and CIS markets. Brands publish campaigns ("orders"), influencers apply, and both sides chat in real time, sign collaborations, and track performance on role-specific dashboards.

Product decisions for the post-diploma launch are in [docs/PRODUCT-BRIEF.md](docs/PRODUCT-BRIEF.md); the build plan is in [tasks/todo.md](tasks/todo.md).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Chakra UI, React Router 6, TanStack React Query 5, Axios, socket.io-client, React Hook Form, Recharts |
| Backend | NestJS 10, TypeScript, TypeORM 0.3, `@nestjs/jwt` + Passport, `@nestjs/websockets` + Socket.io 4 |
| Database | PostgreSQL 14 |
| API docs | Swagger / OpenAPI at `/docs` in development only |
| Containerisation | Docker, docker-compose |

## Local setup

### Prerequisites
- Node.js 18+ and npm 9+
- Docker Desktop (for the PostgreSQL + backend containers)

### Start the database and backend

```bash
# From the repository root
docker-compose up -d
```

This brings up:
- PostgreSQL 14 on `localhost:5435` (database `influencer_platform`).
- The NestJS backend on `http://localhost:3005` with `synchronize: true` (TypeORM will create the schema automatically on first boot).
- Swagger UI at `http://localhost:3005/docs`.

### Start the frontend

```bash
cd frontend
npm ci
npm run dev
```

The Vite dev server runs on `http://localhost:3000` and talks to the backend at `http://localhost:3005` via `VITE_API_BASE_URL`.

### Quick health check

```bash
curl http://localhost:3005           # → "Hello World!"
open http://localhost:3005/docs      # → Swagger UI
open http://localhost:3000           # → React landing page
```

## Environment variables

### Backend

Variables are read by [backend/src/config/configuration.ts](backend/src/config/configuration.ts). When running through docker-compose they are set in [docker-compose.yml](docker-compose.yml). For local non-Docker runs, create a `.env` file in `backend/`.

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | HTTP listen port | `3000` (compose overrides to `3005`) |
| `DB_HOST` | PostgreSQL hostname | `localhost` (compose: `postgres`) |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | Database name | `diploma` (compose: `influencer_platform`) |
| `NODE_ENV` | Environment flag | unset; production disables TypeORM synchronization and Swagger |
| `JWT_SECRET` | Access-token signing key | Development fallback only; **required in production** |
| `JWT_REFRESH_SECRET` | Refresh-token signing key | Falls back only in development; **required and distinct in production** |

### Frontend

Frontend env vars are read by [frontend/src/services/api.ts](frontend/src/services/api.ts) and [frontend/src/services/socket.ts](frontend/src/services/socket.ts).

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend HTTP base URL (also used by the WebSocket client) | `http://localhost:3005` |

> No `.env` files containing real credentials should be committed. The compose file ships only with development defaults.

## Demo flow

The platform implements two role-based flows. Walk through them like this for a defence demo:

### 1. Brand happy path

1. Open `http://localhost:3000/register` and register two accounts:
   - `brand@demo.kz` (role: Brand)
   - `influencer@demo.kz` (role: Influencer)
2. Log in as the brand. Land on `/brand/dashboard`.
3. Go to `/brand/profile/edit` and complete the brand profile (industry, location, categories, languages).
4. Go to `/brand/orders/create` and publish an order (title ≥ 3 chars, description ≥ 10 chars, budget, category, requirements, deadline).
5. Browse `/brand/influencers` to see the influencer directory; recommendations are available via `GET /matching/recommendations/influencers`.
6. After the influencer applies (next flow), open `/brand/orders` and click the order to see applications. Accept one — this transitions the application to `accepted` server-side.
7. Open `/brand/messages` and chat with the influencer in real time. Both browsers stay in sync via WebSocket.
8. Open `/brand/matches`, then `/brand/matches/:id`, and update match stats.
9. Open `/brand/dashboard` and review KPI cards (`GET /statistics/brand`).

### 2. Influencer happy path

1. Log in as the influencer. Land on `/influencer/dashboard`.
2. Go to `/influencer/profile/edit` and complete the influencer profile (categories, languages, social-media handles, follower count).
3. Open `/influencer/orders` to see available orders.
4. Click an order, then submit an application with a cover letter and proposed price.
5. Open `/influencer/applications` to see the application's status (it transitions when the brand accepts or rejects).
6. Open `/influencer/recommendations` for AI-style brand recommendations.
7. Open `/influencer/messages` to continue the chat with the brand.

### Demo accounts

The repository does not ship with seed data. Use the registration form to create the two demo accounts above. Once registered, you can re-use them across runs (their data persists in the `postgres_data` Docker volume).

## Main API modules

In development, the full OpenAPI reference is served at `/docs`.

| Module | Base path | Purpose |
|---|---|---|
| Auth | `/auth` | Register, login, JWT refresh, account deletion. |
| Users | `/users` | User CRUD, influencer/brand directory (JWT-guarded). |
| Profiles | `/profiles` | Brand and influencer profiles, social-media handles, role-gated counterpart search. |
| Orders | `/orders` | Brand publishes orders; influencer browses available orders. |
| Order Applications | `/order-applications` | Influencer applies; brand accepts/rejects; influencer withdraws. |
| Collaborations | `/collaborations` | Long-running brand–influencer collaboration records. |
| Matching | `/matching` | Match lifecycle, deterministic match-score, recommendation endpoints. |
| Chats | `/chats` | REST chat creation and message persistence. |
| Chats WebSocket | `ws://.../chats` | Real-time `newMessage`, `chatUpdated`, `messagesRead`, `newChat` events. |
| Categories | `/categories` | Static list of platform-wide content categories used by the dashboards (JWT-guarded). |
| Statistics | `/statistics` | Brand and influencer aggregated KPIs. |

Maintenance endpoints under `/chats/debug/*` and `/chats/fix-messages/*` are restricted to the `admin` role and hidden from the public Swagger document.

## Authentication model

- JWT access token (15 minutes) + refresh token (7 days, bcrypt-hashed before being persisted on `users.refreshToken`). Tokens carry explicit `tokenType` claims; protected REST and Socket.IO accept access tokens only, while `/auth/refresh` accepts refresh tokens only.
- `JwtAuthGuard` enforces authentication; `RolesGuard` enforces the `@Roles(...)` decorator (values: `admin`, `brand`, `influencer`).
- Public endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /`; `/docs` is development-only.
- Frontend stores both tokens in `localStorage`; its Axios interceptor performs one single-flight refresh/replay before logging out on failed refresh.

## Known limitations

These items are listed honestly so the defense committee can verify what is implemented and what is a future improvement.

- **No admin UI.** The `admin` role exists at the API layer (used only for `/chats/...` maintenance endpoints and `/collaborations` deletion) but no admin page is shipped.
- **No notifications subsystem.** Email and in-app notifications are not implemented; only WebSocket chat updates are real-time.
- **No file uploads.** Avatars and other media must be supplied as external URLs.
- **Settings preferences are client-only.** Notification, language, and timezone preferences are stored in `localStorage` (key `adpartners.userSettings`); there is no `/users/settings` backend endpoint.
- **Daily-stat aggregation is illustrative.** `StatisticsService` currently returns Match-level totals and a campaign-distribution array; daily-bucket aggregation is a future improvement.
- **Recommendation listings rank by category only.** `MatchingService.calculateMatchScore` returns a deterministic three-factor score (category Jaccard + audience overlap + engagement); the listing endpoints (`/matching/recommendations/influencers` and `.../brands`) currently rank by `categoryMatch`. Wiring the full score into the listings is a future improvement.
- **Production migrations are not yet proven.** Production synchronization is disabled and the migration runner/first uniqueness migration exist, but a full schema baseline must be generated and tested against a disposable PostgreSQL instance before any first production deployment.
- **Frontend dependency risk is small.** The frontend builds with Vite (CRA removed). `npm audit` reports 2 moderate advisories in React Router 6, fixed only in v7.
- **No verified production hosting.** A production Docker/NGINX deployment configuration exists in [DEPLOY.md](DEPLOY.md), but it has not been deployed or operationally verified in this repository.
- **Automated coverage is targeted, not comprehensive.** The backend has focused auth, matching, profile-filter, order, and stats-validation unit tests; the frontend has a smoke test. Disposable-PostgreSQL integration and browser E2E coverage remain required before production.
- **Order edit / delete are not available.** The brand UI does not expose Edit/Delete buttons in the demo build because the backend does not implement `PATCH /orders/:id` or `DELETE /orders/:id`. Order creation, listing, and application acceptance are fully implemented.

## Documentation index

| File | Purpose |
|---|---|
| [docs/PRODUCT-BRIEF.md](docs/PRODUCT-BRIEF.md) | Product decisions for the Kazakhstan launch |
| [tasks/todo.md](tasks/todo.md) | Productization plan, phase by phase |
| [DEPLOY.md](DEPLOY.md) | Production deployment with Docker Compose and nginx |
| [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Every environment variable and where it is read |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Theme tokens and shared UI components |
| [docs/audits/](docs/audits/) | Project audits |

## License

Academic project — bachelor diploma deliverable for SDU University.
