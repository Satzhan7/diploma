# Environment Variables — Complete Analysis

**Date:** 2026-06-10. Reflects the repo **after** commit `6664b8e` (name mismatches fixed). Supersedes the 2026-06-09 table, which described the pre-fix state.

## Backend

| Variable | Required | Used in | Defined (dev compose) | Defined (prod compose) | Default | Notes |
|---|---|---|---|---|---|---|
| `PORT` | no | `configuration.ts:2`, `main.ts:34` | ✅ `3005` | ✅ `3005` | `3000` | OK |
| `NODE_ENV` | no | `configuration.ts:12`, Dockerfile | ✅ `development` | ✅ `production` | — | Gates synchronize fallback |
| `DB_HOST` | yes (Docker) | `configuration.ts:4` | ✅ `postgres` | ✅ `postgres` | `localhost` | OK |
| `DB_PORT` | no | `configuration.ts:5` | ✅ `5432` | ✅ `5432` | `5432` | OK |
| `DB_USERNAME` | yes (prod) | `configuration.ts:6` | ✅ `postgres` | ✅ `${DB_USER}` | `postgres` | Aligned since `6664b8e` |
| `DB_PASSWORD` | yes (prod) | `configuration.ts:7` | ✅ `postgres` | ✅ `${DB_PASSWORD}` | `postgres` | Aligned |
| `DB_NAME` | yes | `configuration.ts:8` | ✅ `influencer_platform` | ✅ `${DB_NAME}` | `diploma` | OK |
| `DB_SYNCHRONIZE` | no | `configuration.ts:9-12` | ❌ (fallback: non-prod → `true`) | ✅ `${DB_SYNCHRONIZE:-true}` | `true` unless `NODE_ENV=production` | ⚠️ Prod default `true` is a deliberate demo bootstrap — set `false` once migrations exist (FIX_PLAN 3.1) |
| `JWT_SECRET` | **yes** | `auth.module.ts:20`, `jwt.strategy.ts:15`, `chats.module.ts:17` (raw env via ConfigService) | ✅ placeholder | ✅ `${JWT_SECRET}` | **none on the real read path** | ⚠️ `configuration.ts:15` default `'super-secret'` is **dead code** — consumers read the raw `JWT_SECRET` key, not `jwt.secret`. Unset ⇒ passport-jwt throws at boot ("requires a secret or key"). Fail-fast, but by accident |
| `JWT_ACCESS_EXPIRATION` | no | `configuration.ts:16` (read, **never consumed**) | ✅ `15m` | ✅ `15m` | `15m` | ⚠️ **Decorative** — TTL hardcoded `'15m'` in `auth.service.ts:95` and `auth.module.ts:22` (FIX_PLAN 2.6) |
| `JWT_REFRESH_EXPIRATION` | no | `configuration.ts:17` (read, **never consumed**) | ✅ `7d` | ✅ `7d` | `7d` | ⚠️ Decorative — hardcoded `'7d'` in `auth.service.ts:104`; ChatsModule signs with `'1d'` (`chats.module.ts:19`) |
| `CORS_ORIGIN` | yes (prod) | `main.ts:12-15` | ✅ `http://localhost:3000` | ✅ `https://${DOMAIN}` | **`true` (reflect any origin)** | ⚠️ Fallback is reflect-all with `credentials:true` — fail closed in prod (SECURITY H6) |

## Frontend (build-time only — CRA inlines at `npm run build`)

| Variable | Required | Used in | Defined | Default | Notes |
|---|---|---|---|---|---|
| `REACT_APP_API_BASE_URL` | yes (prod) | `services/api.ts:3`, `services/socket.ts:4` | ✅ build arg in both compose files + Dockerfile ARG/ENV | `http://localhost:3005` | Aligned since `6664b8e`. ⚠️ `socket.ts` misuses it: appending `/chats` to a URL containing the `/api` path yields the wrong socket.io namespace in prod (FIX_PLAN 2.1) |
| `HTTPS` | no | CRA dev server | `frontend/.env` (untracked): `false` | `false` | Dev-only toggle, harmless |

## Compose-level (`.env.prod` consumed by `docker-compose.prod.yml`)

| Variable | Required | Used in | Example (`.env.prod.example`) | Notes |
|---|---|---|---|---|
| `DOMAIN` | yes | frontend build arg, backend `CORS_ORIGIN` | `adpartners.kz` | Also hardcoded in `nginx/site.conf:3,16` — keep in sync |
| `DB_USER` | yes | postgres init + backend `DB_USERNAME` | `adpartners` | |
| `DB_PASSWORD` | yes | postgres init + backend | `CHANGE_ME_STRONG_PASSWORD` | Placeholder ✅ |
| `DB_NAME` | yes | postgres init + backend | `adpartners` | |
| `JWT_SECRET` | yes | backend | `CHANGE_ME_64_RANDOM_CHARS` | Placeholder ✅ |
| `DB_SYNCHRONIZE` | no | backend | `true` | See backend table |

## Findings summary

- **Missing:** none required for startup (dev compose is self-contained).
- **Unused/decorative:** `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION` (set everywhere, consumed nowhere).
- **Mismatched names:** none remaining (fixed in `6664b8e`). One **path** mismatch remains: `configuration.ts` exposes `jwt.*` config keys no consumer reads — JWT consumers read raw `JWT_SECRET`.
- **Secrets in repo:** none real. Dev compose carries placeholder creds (`postgres/postgres`, `your-secret-key-change-in-production` at `docker-compose.yml:37-39`) — dev-only, never copy to prod. `.env.prod` is gitignored; only `.env.prod.example` with `CHANGE_ME` values is tracked.
- **Hardcoded values that should be env:** token TTLs (above); `DOMAIN` duplicated in `nginx/site.conf`.
