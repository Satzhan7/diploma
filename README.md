# AdPartners.kz

> Web platform connecting brands with local influencers in Kazakhstan and the CIS region.
> Bachelor diploma project — SDU University, Faculty of Engineering and Natural Sciences, course 6B06102 "Computer Science", 2025.
> Team **Innovators**: Kadir Satzhan and Abenov Aslan. Supervisor: Akhmetov Tolegen.

## Overview

AdPartners.kz is a full-stack web application that brings influencer-marketing discovery, negotiation, collaboration, and analytics into a single product targeted at the Kazakh and CIS markets. Brands publish campaigns ("orders"), influencers apply, and both sides chat in real time, sign collaborations, and track performance on role-specific dashboards.

The full documentation set lives under [docs/diploma/](docs/diploma/) and includes a Product Requirements Document, function-by-function reference, technical architecture, database schema, API reference, testing plan, thesis structure, and a LaTeX conversion plan.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Chakra UI, React Router 6, TanStack React Query 5, Axios, socket.io-client, React Hook Form, Recharts |
| Backend | NestJS 10, TypeScript, TypeORM 0.3, `@nestjs/jwt` + Passport, `@nestjs/websockets` + Socket.io 4 |
| Database | PostgreSQL 14 |
| API docs | Swagger / OpenAPI at `/docs` |
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
npm install
npm start
```

The CRA dev server runs on `http://localhost:3000` and talks to the backend at `http://localhost:3005` via `REACT_APP_API_BASE_URL`.

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
| `NODE_ENV` | Environment flag | unset; `production` disables TypeORM `synchronize` |
| `JWT_SECRET` | Symmetric JWT signing key | `super-secret` — **must be overridden in production** |

### Frontend

Frontend env vars are read by [frontend/src/services/api.ts](frontend/src/services/api.ts) and [frontend/src/services/socket.ts](frontend/src/services/socket.ts).

| Variable | Purpose | Default |
|---|---|---|
| `REACT_APP_API_BASE_URL` | Backend HTTP base URL (also used by the WebSocket client) | `http://localhost:3005` |

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
