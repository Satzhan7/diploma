# Environment Variables — Complete Analysis

**Date:** 2026-06-10. Reflects the repo **after** commit `6664b8e` (name mismatches fixed). Supersedes the 2026-06-09 table, which described the pre-fix state.

## Backend

| Variable | Required | Used in | Defined (dev compose) | Defined (prod compose) | Default | Notes |
|---|---|---|---|---|---|---|
| `PORT` | no | `configuration.ts:2`, `main.ts:34` | ✅ `3005` | ✅ `3005` | `3000` | OK |
| `NODE_ENV` | no | `configuration.ts:12`, Dockerfile | ✅ `development` | ✅ `production` | — | Gates synchronize fallback; `production` applies the migrations on boot |
| `DB_HOST` | yes (Docker) | `configuration.ts:4` | ✅ `postgres` | ✅ `postgres` | `localhost` | OK |
| `DB_PORT` | no | `configuration.ts:5` | ✅ `5432` | ✅ `5432` | `5432` | OK |
| `DB_USERNAME` | yes (prod) | `configuration.ts:6` | ✅ `postgres` | ✅ `${DB_USER}` | `postgres` | Aligned since `6664b8e` |
| `DB_PASSWORD` | yes (prod) | `configuration.ts:7` | ✅ `postgres` | ✅ `${DB_PASSWORD}` | `postgres` | Aligned |
| `DB_NAME` | yes | `configuration.ts:8` | ✅ `influencer_platform` | ✅ `${DB_NAME}` | `diploma` | OK |
| `DB_SYNCHRONIZE` | no (dev), forced false (prod) | `configuration.ts:9-14` | ❌ (non-production defaults true) | ✅ literal `false` | `true` only outside production | Production synchronization is never enabled. |
| `DB_MIGRATIONS_RUN` | no | `configuration.ts` (`parseBooleanEnv`), `app.module.ts` | ❌ | ✅ `${DB_MIGRATIONS_RUN:-}` | on when `NODE_ENV=production`, else off | `true` / `false` (case-insensitive); empty = default; anything else stops startup. Kill switch for applying migrations on boot; with `false`, apply them with `npm run migration:run:prod`. |
| `FREE_TEST_PERIOD` | no | `configuration.ts` (`parseBooleanEnv`), `plan/plan.service.ts` | ✅ `${FREE_TEST_PERIOD:-true}` | ✅ `${FREE_TEST_PERIOD:-true}` | `true` | Test period (D3): `true` gives every brand the Pro plan at no cost and the Plan page shows no payment step; `false` restores the paywall (stored plan + `proExpiresAt`). Anything other than `true`/`false` stops startup. |
| `UPLOAD_DIR` | no | `configuration.ts`, `files/storage/local-disk.storage.ts` | ✅ `/data/uploads` (volume `uploads_data`) | ✅ `/data/uploads` (volume `uploads_data`) | `./uploads` under the working directory | Private directory for uploaded images (D4). Back the volume up with the database. |
| `ADMIN_PASSWORD` | no | `scripts/create-admin.ts` only | ❌ | ❌ (pass with `-e` when running the script) | generated and printed once | Password for `admin:create`, at least 12 characters. Not read by the server. |
| `JWT_SECRET` | **yes (prod)** | `configuration.ts`, `auth.module.ts`, `jwt.strategy.ts` | ✅ placeholder | ✅ `${JWT_SECRET}` | development fallback | Access-token signing key; production startup fails if missing. |
| `JWT_REFRESH_SECRET` | **yes (prod)** | `configuration.ts`, `auth.service.ts` | ❌ (falls back to JWT secret in dev only) | ✅ `${JWT_REFRESH_SECRET}` | development fallback | Refresh-token signing key; use a different random value from `JWT_SECRET`. |
| `JWT_ACCESS_EXPIRATION` | no | `configuration.ts`, `auth.service.ts`, `auth.module.ts` | ✅ `15m` | ✅ `15m` | `15m` | Consumed by access-token signing. |
| `JWT_REFRESH_EXPIRATION` | no | `configuration.ts`, `auth.service.ts` | ✅ `7d` | ✅ `7d` | `7d` | Consumed by refresh-token signing. |
| `CORS_ORIGIN` | **yes (prod)** | `main.ts`, `chats.gateway.ts` | ✅ `http://localhost:3000` | ✅ `https://${DOMAIN}` | reflect-all only in development | Production startup fails if missing. |
| `SMTP_HOST` | **yes (prod)** | `configuration.ts` (`mail.smtp`), `smtp-mail.service.ts` | ✅ `mailpit` | ✅ `${SMTP_HOST}` | `localhost` | Sign-up code email. Production startup fails if missing. Dev mail lands in Mailpit (UI http://localhost:8025). |
| `SMTP_PORT` | no | `configuration.ts` | ✅ `1025` | ✅ `${SMTP_PORT:-587}` | `1025` | |
| `SMTP_SECURE` | no | `configuration.ts` | ❌ | ✅ `${SMTP_SECURE:-false}` | `false` | `true` = TLS from the start (port 465); `false` = STARTTLS when the server offers it. |
| `SMTP_USER` / `SMTP_PASS` | prod provider | `configuration.ts` | ❌ (Mailpit needs no auth) | ✅ `${SMTP_USER}` / `${SMTP_PASS}` | unset = no auth | Secret; never commit. |
| `MAIL_FROM` | **yes (prod)** | `configuration.ts`, `smtp-mail.service.ts` | ✅ `AdPartners <no-reply@adpartners.kz>` | ✅ `${MAIL_FROM}` | `AdPartners <no-reply@adpartners.kz>` | Sender of every email. Production startup fails if missing. |

## Frontend (build-time only — Vite inlines `VITE_*` at `npm run build`)

| Variable | Required | Used in | Defined | Default | Notes |
|---|---|---|---|---|---|
| `VITE_API_BASE_URL` | yes (prod) | `services/api.ts:3`, `services/socket.ts:3-28` | ✅ build arg in both compose files + Dockerfile ARG/ENV | `http://localhost:3005` | Socket client derives the origin before joining `/chats`, so the `/api` production path is safe. |
| `HTTPS` | no | nothing (was the CRA dev server) | `frontend/.env` (untracked): `false` | `false` | Ignored by Vite; safe to delete |

## Compose-level (`.env.prod` consumed by `docker-compose.prod.yml`)

| Variable | Required | Used in | Example (`.env.prod.example`) | Notes |
|---|---|---|---|---|
| `DOMAIN` | yes | frontend build arg, backend `CORS_ORIGIN` | `adpartners.kz` | Also hardcoded in `nginx/site.conf:3,16` — keep in sync |
| `DB_USER` | yes | postgres init + backend `DB_USERNAME` | `adpartners` | |
| `DB_PASSWORD` | yes | postgres init + backend | `CHANGE_ME_STRONG_PASSWORD` | Placeholder ✅ |
| `DB_NAME` | yes | postgres init + backend | `adpartners` | |
| `JWT_SECRET` | yes | backend | `CHANGE_ME_64_RANDOM_CHARS` | Placeholder ✅ |
| `JWT_REFRESH_SECRET` | yes | backend | `CHANGE_ME_A_DIFFERENT_64_RANDOM_CHARS` | Placeholder ✅; must differ from access secret. |
| `DB_SYNCHRONIZE` | no | backend | `false` | Forced false by production compose. |
| `DB_MIGRATIONS_RUN` | no | backend | `true` | Passed through by production compose; `false` skips migrations on boot. |
| `FREE_TEST_PERIOD` | no | backend | `true` | `false` ends the test period: Free brands lose "Verified only" until an admin sets Pro. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | `SMTP_HOST`, `MAIL_FROM` yes | backend | `smtp.example.kz`, `587`, `false`, `CHANGE_ME`, `CHANGE_ME`, `AdPartners <no-reply@adpartners.kz>` | Provider chosen with D2 (KZ data residency). |

## Findings summary

- **Missing:** none required for startup (dev compose is self-contained).
- **Unused/decorative:** none of the token TTL variables; both are consumed by signing.
- **Mismatched names:** none. JWT consumers use the `jwt.*` configuration paths consistently.
- **Secrets in repo:** none real. Dev compose carries placeholder creds (`postgres/postgres`, `your-secret-key-change-in-production` at `docker-compose.yml:37-39`) — dev-only, never copy to prod. `.env.prod` is gitignored; only `.env.prod.example` with `CHANGE_ME` values is tracked.
- **Hardcoded values that should be env:** token TTLs (above); `DOMAIN` duplicated in `nginx/site.conf`.
