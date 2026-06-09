# Fix Plan (proposed — no code changed yet)

Ordered by severity. Each item: problem → root cause → files → effort → exact proposed change. IDs map to [AUDIT.md](AUDIT.md). Pick the **demo-fast** path for the defense; the **production** path for a clean portfolio repo.

---

## Critical — blocks running / deployment

### C1 (F1) — Prod backend can't authenticate to Postgres
**Root cause:** env var name mismatch. App reads `DB_USERNAME`/`DB_PASSWORD`/`DB_PORT`; compose provides `DATABASE_USERNAME`/`DATABASE_PASSWORD`/`DATABASE_PORT`.
**Files:** `docker-compose.yml`, `docker-compose.prod.yml` (or `backend/src/config/configuration.ts`).
**Effort:** 10 min.
**Fix (align compose to the app — preferred):**
```diff
# docker-compose.prod.yml (and docker-compose.yml)
-      - DATABASE_PORT=5432
-      - DATABASE_USERNAME=${DB_USER}
-      - DATABASE_PASSWORD=${DB_PASSWORD}
+      - DB_PORT=5432
+      - DB_USERNAME=${DB_USER}
+      - DB_PASSWORD=${DB_PASSWORD}
```
Apply the same rename in `docker-compose.yml` (dev: `DB_USERNAME=postgres`, `DB_PASSWORD=postgres`). After this the app no longer relies on lucky defaults.

### C2 (F2) — Prod frontend calls localhost instead of the API
**Root cause:** code reads `REACT_APP_API_BASE_URL`; build passes `REACT_APP_API_URL`.
**Files:** `frontend/Dockerfile`, `docker-compose.prod.yml` (or `frontend/src/services/api.ts`).
**Effort:** 5 min.
**Fix (rename the build arg to match code):**
```diff
# frontend/Dockerfile
-ARG REACT_APP_API_URL
-ENV REACT_APP_API_URL=${REACT_APP_API_URL}
+ARG REACT_APP_API_BASE_URL
+ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
```
```diff
# docker-compose.prod.yml  (frontend.build.args)
-        REACT_APP_API_URL: https://${DOMAIN}/api
+        REACT_APP_API_BASE_URL: https://${DOMAIN}/api
```
Note: services call paths like `/auth/login` — with base `https://domain/api`, nginx strips `/api` (`proxy_pass http://backend:3005/;`), so `/api/auth/login` → backend `/auth/login`. ✅ consistent.

### C3 (F3) — Fresh prod DB has no schema
**Root cause:** `synchronize:false` in prod, no base migration, no `migrationsRun`.
**Files:** `backend/src/config/configuration.ts`, `backend/src/app.module.ts`.
**Effort:** demo path 5 min · production path 1–2 h.
**Demo-fast fix** (acceptable for diploma): force synchronize on for the demo DB.
```diff
# configuration.ts
-    synchronize: process.env.NODE_ENV !== 'production',
+    synchronize: process.env.DB_SYNCHRONIZE === 'true'
+      ? true
+      : process.env.NODE_ENV !== 'production',
```
then set `DB_SYNCHRONIZE=true` in prod compose for the demo only.
**Production fix:** add TypeORM DataSource + CLI, run `migration:generate` against an empty DB to capture the full baseline, register migrations + `migrationsRun: true` in `app.module.ts`, keep `synchronize:false`.

---

## High — core functionality / deployment completeness

### H1 (F4) — `docker compose up --build` does not start the UI
**Root cause:** dev compose omits a frontend service; thesis claims one-command full stack.
**Files:** `docker-compose.yml`.
**Effort:** 20 min.
**Fix:** add a frontend service, OR update README/thesis to state the UI runs via `cd frontend && npm start`. Adding the service makes the "one command" claim true:
```yaml
  frontend:
    build:
      context: ./frontend
      args:
        REACT_APP_API_BASE_URL: http://localhost:3005
    ports: ["3000:80"]
    depends_on: [backend]
    networks: [app-network]
```

### H2 (F5) — MinIO / uploads / Gemini documented but absent
**Root cause:** thesis + slides describe features never built.
**Files:** documentation only (`docs/diploma/*`, thesis PDF source).
**Effort:** 30 min (docs) — **do not fabricate code under time pressure**.
**Fix:** Either (a) **scope-correct the thesis**: move MinIO/uploads to "Future Work / not implemented" exactly as Gemini already is (lowest risk, honest, defensible), or (b) implement a minimal `UploadsModule` (multer + local disk, or a real MinIO container) if time allows. Recommendation for defense: **(a)** — the report already models honest scoping for Gemini; mirror it for MinIO. Prevents the worst defense outcome (examiner asks to demo a non-existent feature).

### H3 (Security) — wide-open CORS + no auth rate limiting
**Files:** `backend/src/main.ts`, `backend/src/app.module.ts`.
**Effort:** 30 min.
**Fix:**
```diff
# main.ts
-  app.enableCors();
+  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true });
```
Add `@nestjs/throttler` `ThrottlerModule` globally; tighter limit on `auth` routes.

---

## Medium — maintainability / clarity

### M1 (F6) — remove dead modules
Delete unused `backend/src/brands/`, `backend/src/influencers/`, `backend/src/messages/` (verified not imported in `app.module.ts`). Keep `chats/` as canonical messaging. **Effort:** 20 min. Removes duplicate `Message` entity confusion.

### M2 (F7) — remove stray root `src/` and root `package.json`
Delete `src/matching/`, `src/orders/`, root `package.json`/`package-lock.json` (real apps live in `backend/` and `frontend/`). **Effort:** 5 min.

### M3 (F9) — retire hand-fix scripts
Fold `backend/src/scripts/*` into a `migrations/` baseline (C3 production path) or `archive/`. **Effort:** folded into C3.

### M4 — separate refresh-token secret
Add `JWT_REFRESH_SECRET`; sign/verify refresh tokens with it. **Files:** `auth.service.ts`, `configuration.ts`. **Effort:** 30 min.

### M5 — actually read JWT expiration env vars
`configuration.ts` hard-codes `'15m'`/`'7d'`. Read `JWT_ACCESS_EXPIRATION`/`JWT_REFRESH_EXPIRATION` or drop them from compose. **Effort:** 10 min.

---

## Low — polish

- **L1 (F10):** `backend/Dockerfile` `EXPOSE 3000` → `EXPOSE 3005`.
- **L2 (F11):** delete `frontend/src/mocks/`.
- **L3 (F12):** write `frontend/README.md` (run/build/env), or delete it.
- **L4:** add `frontend/.env.example` documenting `REACT_APP_API_BASE_URL`.
- **L5:** move tokens to HttpOnly cookies to match the thesis claim (larger change; optional).

---

## Suggested commit grouping (when you apply)
1. `fix(docker): align DB + frontend env var names, add frontend service` (C1, C2, H1, L1)
2. `fix(db): make prod schema reproducible` (C3)
3. `chore: remove dead modules and stray root files` (M1, M2, L2)
4. `feat(security): scope CORS, add rate limiting, split refresh secret` (H3, M4, M5)
5. `docs: scope-correct MinIO/uploads/Vite claims` (H2)
6. `docs: frontend README + .env.example` (L3, L4)

All on a branch off `main` (e.g. `audit/fixes`), PR-reviewed.
