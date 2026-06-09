# Environment Variables

Every env var referenced in code or compose. ⚠️ marks a name mismatch between what the app reads and what is provided (see [AUDIT.md](AUDIT.md) F1/F2).

## Backend (read by `backend/src/config/configuration.ts`)

| Variable | Required | Default (fallback) | Used in | Description |
|---|---|---|---|---|
| `PORT` | no | `3000` | configuration.ts, main.ts | API listen port. Compose sets `3005`. |
| `NODE_ENV` | no | — | configuration.ts | `production` flips `synchronize` off. |
| `DB_HOST` | yes (Docker) | `localhost` | configuration.ts | Postgres host. Compose: `postgres`. ✅ |
| `DB_PORT` | no | `5432` | configuration.ts | Postgres port. ⚠️ Compose sets `DATABASE_PORT` — **not read** (default used). |
| `DB_USERNAME` | yes (prod) | `postgres` | configuration.ts | DB user. ⚠️ Compose sets `DATABASE_USERNAME` — **not read** → prod auth fails. |
| `DB_PASSWORD` | yes (prod) | `postgres` | configuration.ts | DB password. ⚠️ Compose sets `DATABASE_PASSWORD` — **not read**. |
| `DB_NAME` | yes | `diploma` | configuration.ts | Database name. Compose: `influencer_platform`/`${DB_NAME}`. ✅ |
| `JWT_SECRET` | yes | `super-secret` | configuration.ts, jwt.strategy | Signs access + refresh tokens. ✅ provided. |
| `DB_SYNCHRONIZE` | no | — | (proposed in FIX_PLAN C3) | Not yet used. Suggested toggle for demo schema. |

**Decorative (provided but never read):** `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION` — set in both compose files but `configuration.ts:13-14` hard-codes `'15m'`/`'7d'`.

## Frontend (read by `frontend/src/services/api.ts`)

| Variable | Required | Default (fallback) | Used in | Description |
|---|---|---|---|---|
| `REACT_APP_API_BASE_URL` | yes (prod) | `http://localhost:3005` | api.ts | Axios base URL. ⚠️ Dockerfile/compose pass `REACT_APP_API_URL` — **name mismatch**, so prod build ignores it and bakes the localhost fallback. |

## Compose-level (`.env.prod` → `docker-compose.prod.yml`)

| Variable | Required | Used in | Description |
|---|---|---|---|
| `DOMAIN` | yes (prod) | prod compose, nginx, frontend arg | Public domain (`adpartners.kz`). |
| `DB_USER` | yes (prod) | prod compose | Maps to Postgres `POSTGRES_USER` and (intended) backend `DB_USERNAME`. |
| `DB_PASSWORD` | yes (prod) | prod compose | Postgres password + backend. |
| `DB_NAME` | yes (prod) | prod compose | Database name. |
| `JWT_SECRET` | yes (prod) | prod compose | Backend signing key. |

## Summary of problems
- **Mismatched names (breaking):** `DATABASE_USERNAME/PASSWORD/PORT` ≠ `DB_USERNAME/PASSWORD/PORT`; `REACT_APP_API_URL` ≠ `REACT_APP_API_BASE_URL`.
- **Unused but provided:** `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `DATABASE_PORT`.
- **Missing artifact:** no `frontend/.env.example`; root `.env.prod.example` exists ✅.
- **Recommended additions (FIX_PLAN):** `CORS_ORIGIN`, `JWT_REFRESH_SECRET`, `DB_SYNCHRONIZE`.
