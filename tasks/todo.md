# Productization Plan — AdPartners.kz v1 (2026-10-01)

Source: [docs/PRODUCT-BRIEF.md](../docs/PRODUCT-BRIEF.md) (from the grilling session) + project audit of 2026-10-01.
Format: ECC `blueprint`. Each step is about one PR. Dependencies are listed under "Needs". Steps marked ∥ can run in parallel with the other ∥ steps in the same phase.
Rule: every phase ends with something deployable and usable. Nothing goes to `main` without passing CI.

## Decisions still open (resolve before the phase that needs them)

- [x] **D1 — Matches and collaborations (before Phase 2).** Today there are three overlapping concepts: Match, Order→Application, and Collaboration. Recommendation: **one Deal = an accepted Application.** Remove Match and Collaboration; keep the matching *score* as a ranking function only.
  - Decided 2026-10-03: **yes, one Deal.** Match and Collaboration are removed in 2.3; the 1.4 baseline still contains their tables and 2.3 drops them with a migration.
- [x] **D5 — Counterparty email (decided 2026-10-03, applies in Phase 2).** Emails are **never** shown to the other side; contact happens through in-app chat only. Chat creation is limited to pairs that share an application/deal (brand→influencer invites come later).
- [x] **D6 — Account deletion (decided 2026-10-03).** `DELETE /auth/account` 500s on users with data (FK constraints). Deferred to Phase 8 (legal: anonymise vs cascade, retention).
- [ ] **D2 — Hosting in Kazakhstan (before Phase 8).** Choose a KZ provider (e.g. PS Cloud, Hoster.kz, Kazakhtelecom cloud) with Postgres and S3-compatible storage, to comply with the personal-data localisation law.
- [x] **D3 — Pro price and Free limits (decided 2026-10-04).** The platform runs as a **free test version**: nobody is charged. The Plan model, Plan page and the Pro price (₸19 900/month, Free = unlimited briefs) stay as designed; a test-period switch gives every brand Pro features at no cost (R4).
- [x] **D4 — Screenshot storage (decided 2026-10-04).** Local private disk volume behind a storage interface now; S3-compatible KZ storage later with D2.

## Phase 0 — Stabilise (audit P0/P1). Must be first.
- [ ] 0.1 Commit or split the current `audit/fixes` working tree (98 changed files) into reviewable commits; merge to `main`.
  - [x] Split into 10 commits (`ddfd5ac`..`431875c`): prettier-only, auth, authz, migrations infra, orders/profile identity, build hardening, UI tokens, frontend fixes, docs, removal of docs/diploma. Every commit typechecks (backend + frontend).
  - [x] PR `audit/fixes` → `v1` opened: https://github.com/Satzhan7/diploma/pull/1. Local history (root `354b3c4`) shares no ancestor with GitHub `main`, so the PR targets `v1`. Merge is left to the team.
- [x] 0.2 Fix the chat WebSocket leaking password/refresh hashes: emit `{id,name}` DTOs only. `chat-events.ts` allow-lists `{id,name,role}`; gateway spec deep-scans `newMessage`/`newChat`/`messagesRead` payloads for `password`/`refreshToken`/`email` (2 tests fail on the old gateway, pass now).
- [x] 0.3 Add `trust proxy`; scope `GET /orders/:id` and `GET /users*` to their owners or admins.
  - `trust proxy` = 1 (nginx `/api/` sets X-Forwarded-For). `GET /orders/:id`: brand owner, assigned influencer or admin get the order; others get a public projection of OPEN orders and 403 otherwise. `GET /orders/available` uses the same projection (it also shipped brand emails). `GET /users` is admin-only; `/users/:id`, `/users/influencers`, `/users/brands` return `toPublicUser` (no email). Tests: `orders.service.spec.ts`, `users.controller.spec.ts`.
  - Follow-up: an applicant whose order is no longer OPEN now gets 403 on its detail page (spec as written). Revisit with the Deal model in Phase 2.
- [x] 0.4 Run `npm audit fix` in both apps (typeorm, jws, ws, axios).
  - `npm audit --omit=dev` backend: 33 (1 low, 13 moderate, 17 high, 2 critical) → 18 (1 low, 10 moderate, 6 high, 1 critical). typeorm 0.3.31, ws 8.21.3, validator fixed. Lock regenerated in the Node 18 container.
  - Frontend: 65 (14 low, 15 moderate, 33 high, 3 critical) → 31 (9 low, 6 moderate, 16 high, 0 critical). Exact pins bumped in-major: axios 1.16.0 → 1.20.0, react-router-dom 6.30.4 → 6.30.6.
  - Deferred (major bumps only, do not `--force`): `@nestjs/*` 10 → 11/12 (core injection advisory, multer, body-parser, qs, file-type), `@nestjs/swagger` 11 (js-yaml, lodash), `@nestjs/typeorm` 11 (uuid), `bcrypt` 6 (drops node-pre-gyp → tar critical, install-time only), `react-router-dom` 7 (open-redirect via backslash in `<Link>`), `react-scripts` chain (removed by Vite in 1.2).
- [x] 0.5 Fix five broken frontend flows: withdraw, `/orders/:id` link, Profile `user` relation, brand profile-id links, and clearing state on logout.
  - Withdraw uses `DELETE /order-applications/:id` and is offered for PENDING only (the backend rejects anything else). Title link → `/influencer/orders/:id`. `GET /profiles/:userId` now loads `user` as a public projection; Profile chat falls back to the `userId` route param, never the profile id. Brand links use `order.brand.user.id`; `GET /order-applications` loads `order.brand.user` (public projection). Logout calls `socketService.disconnect()` and `queryClient.clear()`. Manual QA: see Phase 0 review.
- [x] 0.6 Application state machine plus a locked re-read on accept. This is superseded by 2.2 if D1 is decided first; otherwise do a minimal version here.
  - Minimal version: `APPLICATION_TRANSITIONS` (PENDING → ACCEPTED | REJECTED | WITHDRAWN, all others terminal, admin included). Accept locks the order, then locks and re-reads the application and requires PENDING; bulk-reject only touches PENDING rows. Reject/withdraw are compare-and-set updates (409 if the row moved). Brands may only accept or reject; admins can now accept through the same transaction. 9 new tests in `order-applications.service.spec.ts`.
- **Done when:** the WS payload contains no hashes (test), the IDOR tests return 403, and the five flows pass manual QA.

### Phase 0 review (2026-10-01, commits `623baff`..`e43f6e5` on top of `6b6c775`)

**Done-when status:** WS payload test ✅ (`chats.gateway.spec.ts`: 2 leak tests fail on the old gateway, pass now) · IDOR 403 tests ✅ (`orders.service.spec.ts`, `users.controller.spec.ts`; live: stranger `GET /orders/:id` on an in-progress order → 403, influencer `GET /users` → 403) · five flows manual QA ✅ (11/11 headless-Chrome checks, below). Merging PR #1 (0.1) is left to the team.

**Verification (real output, final tree `e43f6e5`):**
- Backend (Node 18 container): `tsc --noEmit` ok · Jest `Test Suites: 13 passed, 13 total` / `Tests: 56 passed, 56 total` (baseline 10/24) · `nest build` exit 0 · `npx eslint` `✖ 27 problems (27 errors, 0 warnings)`, same 27 as baseline (step 1.3).
- Frontend: `tsc --noEmit` ok · Jest `Test Suites: 2 passed` / `Tests: 3 passed` · `npm run build` exit 0, "Compiled with warnings" · `npx eslint src` 1 error (`App.test.tsx` import/first, pre-existing) + 10 warnings.
- Manual QA, Docker stack, headless Chrome (playwright-core), disposable `qa-*@example.test` accounts (removed afterwards): withdraw sends `DELETE /order-applications/:id` → 200 and the Withdrawn tab updates; no withdraw button on accepted applications; title link → `/influencer/orders/:id`; OrderDetail and MyApplications brand links → `/influencer/profile/<brand user id>`, profile loads; brand on influencer profile sees "Send Collaboration Request" and the influencer role, "Write Message" posts `/chats/<user id>` → 201; after logout, the next user's delayed `GET /chats` shows none of the previous user's cached chats. Not separately proven: socket disconnect on logout (Messages also disconnects on unmount, so the browser test cannot tell them apart).
- Live API: accepted → rejected 400, withdraw accepted 400, `/users/:id`, `/orders/:id` (open), `/profiles/:userId`, `POST /chats` bodies contain no `email`.

**Reviews:** code review (ecc:code-reviewer) verdict "approve with comments", no high items. Security review (ecc:security-reviewer) found 2 high + 4 medium. Fixed in this phase:
- `2eef418` profile search (`/profiles/*/search`) and chat REST responses leaked emails (H) → public projections; TransformInterceptor now fails closed.
- `cd263f1` refresh-token rotation never revoked: bcrypt reads only 72 bytes, every refresh JWT of a user matched (M, reproduced in the container) → SHA-256 + timingSafeEqual. Users log in again once after deploy.
- Found during QA: `8f66941` the CSP from `e78efe4` blocked the dev stack's API (login impossible in local Docker); `e43f6e5` `GET /auth/profile` shared the 10/min login throttle, so ~10 reloads/min logged users out.

**Follow-ups (not fixed, by phase):**
- Phase 2 (Deal model, with D1): counterparty emails still returned on participant/brand paths (`GET /order-applications/:id`, `/order-applications/order/:id`, `/orders/brand`, `/orders/influencer`, participant `GET /orders/:id`, matching, collaborations) — decide when email is revealed. Applicants get 403 on non-OPEN order detail. `POST /chats/:recipientId` lets anyone open a chat with any user id. Admin `PATCH /order-applications/:id` can edit message/price.
- Phase 1/8: `DELETE /auth/account` returns 500 for users with orders/applications/chats (FK constraints). Dev compose publishes backend `:3005` directly, so `X-Forwarded-For` is spoofable in dev (bind to 127.0.0.1 or drop). Make the trust-proxy hop count configurable if a CDN is added. Socket handshake does not check the user still exists. `PATCH /users/:id` changes email without re-verification. JWT secret has a dev default.
- Cleanup: `frontend/src/services/settings.ts` calls `/users/settings` routes that do not exist (500 via `:id`); `BrandList`/`InfluencerList` read `bio`/`industry`/`followers` off the wrong objects; `findAvailable` budget filters have no query DTO.

## Phase 1 — Foundation
- [x] 1.1 ∥ Upgrade the backend Docker image and CI to Node 24 LTS (Node 20 is EOL since April 2026; Node 24 confirmed 2026-10-03); fix the old `jsonwebtoken` chain so all four crashing Jest suites run.
  - `backend/Dockerfile` (both stages) → `node:24-alpine` (v24.21.0). The compose files build from this Dockerfile and pin no Node image, so they need no change. CI uses Node 24 in 1.3. The frontend build image moves with Vite in 1.2.
  - Root cause: `buffer-equal-constant-time@1.0.1` (under `jsonwebtoken` → `jws` → `jwa`, still used by the latest `jwa` 2.0.1) reads `SlowBuffer.prototype` at load; Node 25 removed `SlowBuffer`. Upstream is unmaintained, so `backend/vendor/buffer-equal-constant-time` is a drop-in on `crypto.timingSafeEqual`, wired as a root `file:` dependency plus `"overrides": {"buffer-equal-constant-time": "$buffer-equal-constant-time"}`. `engines.node >=24`, `@types/node` ^24.
  - Host Node v25.8.2 Jest: `Test Suites: 4 failed, 9 passed` → `13 passed, 13 total` / `Tests: 56 passed`. Container (Node 24): `tsc --noEmit` ok, Jest 13/56 pass, `nest build` ok; production target builds and loads `bcrypt` + `jsonwebtoken`. Live: register 201, login, `/auth/profile` 200, tampered signature 401, refresh 200.
  - `npm audit --omit=dev`: 17 (1 low, 10 moderate, 5 high, 1 critical) before and after. Every remaining fix is a major bump not needed here: `@nestjs/*` 11 (core, multer, body-parser, qs, file-type), `@nestjs/swagger` 11 (js-yaml, lodash), `@nestjs/typeorm` 11 (uuid), `bcrypt` 6 (tar via node-pre-gyp, install-time only).
- [x] 1.2 ∥ Migrate the frontend from CRA to Vite (keep Chakra v2, switch Jest to Vitest). Needs: none.
  - Vite 8 + `@vitejs/plugin-react` 6, Vitest 5 + jsdom, RTL 16 / jest-dom 7, TypeScript 5.9 (typescript-eslint supports < 6.1), ESLint 10 flat config (TS recommended, react-hooks, react-refresh; `no-explicit-any` off as in the backend). Build output stays in `build/`; dev server stays on :3000. Test/type packages moved to devDependencies; `react-scripts`, `source-map-loader`, `@types/jest` removed.
  - `REACT_APP_API_BASE_URL` → `VITE_API_BASE_URL` in `api.ts`, `socket.ts`, `vite-env.d.ts`, the Dockerfile ARG/ENV (now `node:24-alpine`), both compose files, `.env.example`, README and `docs/ENVIRONMENT_VARIABLES.md`. Built `index.html` has no inline script, so the nginx CSP template (`script-src 'self'`, `CSP_CONNECT_SRC`) is unchanged.
  - Checks: `tsc --noEmit` ok; Vitest `Test Files 2 passed` / `Tests 3 passed`; `vite build` ok (one 1.25 MB chunk, warning only: route code-splitting is a follow-up); eslint 0 errors / 1 warning (CRA: 1 error / 10 warnings; 18 dead imports/variables removed). CI drops the `CI=false` build workaround.
  - `npm audit` (all and `--omit=dev`): 72 (3 low, 6 moderate, 63 high) → 2 moderate (`react-router` 6, fixed only in v7).
  - Browser QA (Docker nginx build, headless Chrome): 10/10 functional checks: brand and influencer login, brand orders list, influencer orders and applications, both message threads, UI reply delivered live to the brand over Socket.IO. Only console issue: the known Google Fonts CSP block (Phase 3).
- [x] 1.3 ∥ Add a GitHub Actions CI job: typecheck, lint, and test for both apps, plus the frontend build. Needs: 1.1.
  - `.github/workflows/ci.yml`: `backend` (npm ci, typecheck, `lint:check`, Jest, `nest build`) and `frontend` (npm ci, typecheck, eslint, Jest, build) on Node 24. Runs on every pull request (PRs to `v1`, and the stacked Phase 1 PRs whose base is not `v1`) and on pushes to `v1`/`main`.
  - Backend lint 27 errors → 0: unused imports removed; `no-unused-vars` gets `ignoreRestSiblings` (the `{ field: _x, ...rest }` stripping pattern); seed.ts lost 8 `eslint-disable import/first` comments for a rule that is not installed; `getMessages`/`find*For*` keep the access/profile check call without the unused binding.
  - Frontend: `App.test.tsx` import order fixed (jest.mock is hoisted) → 0 errors, 10 warnings remain (CRA). CRA build runs with `CI=false` in CI so warnings are not build errors; this goes away in 1.2.
- [x] 1.4 Add a baseline TypeORM migration that creates the whole schema; set `migrationsRun` in production; remove the `Order.brandUser` and `User.categories` leftovers first. Needs: Docker Postgres, D1 (so the baseline isn't redone).
  - Leftovers removed: `Order.brandUser` (implicit `brandUserId` column) and its inverse `User.orders` (pointed at `order.brand`, a Profile); `User.categories` (`text[]`). `GET /users/influencers?category=` now filters on `Profile.categories`. That column is a `simple-array` (comma text), so `ArrayContains` would be a SQL error; the code uses `Raw` with `string_to_array`. seed.ts already wrote profile categories. Frontend `User.categories` type removed.
  - `1720971600000-AddOrderApplicationUniqueness.ts` deleted (its unique INDEX shared a name with the entity's `@Unique` CONSTRAINT; never deployed).
  - `migration:generate` / `migration:create` scripts. `1791039402679-Baseline.ts` was generated from the 9 entities against an empty `postgres:14-alpine` and reviewed by hand: 9 tables, 7 enums, 19 FKs, `UQ_order_application_order_applicant` is a constraint, no `brandUserId`, no `users.categories`. Added `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.
  - Production: `configuration.ts` `database.migrationsRun = NODE_ENV === 'production'`; AppModule loads `dist/database/migrations/*.js`. The CLI data-source glob was `*{.ts,.js}`, which also matched the emitted `.d.ts` in dist. It now loads `.ts` under ts-node and `.js` from dist.
  - Proof (disposable containers, removed afterwards):
    - Fresh DB, `migration:run` (ts-node): Baseline executed. Re-running `migration:generate --dr` printed "No changes in database schema were found", so there is no drift.
    - Production image, fresh DB A: `npm run migration:run:prod` executed Baseline, then the app booted with `NODE_ENV=production`.
    - Production image, fresh DB B: the app applied Baseline on boot.
    - Both: `/health` 200, `migrations` = `Baseline1791039402679`, 10 tables.
    - API smoke on A: register ×3, login, `PATCH /profiles/me`, create order, apply 201, duplicate apply 409, accept 200 (match row, order `in-progress`), chat and message, `?category=Fashion` → 1, `?category=Gaming` → 0, no filter → 2.
  - Checks: backend `tsc --noEmit` ok · `eslint` 0 problems · Jest `Test Suites: 14 passed` / `Tests: 61 passed` · `nest build` ok. Dev stack (synchronize) dropped the two leftover columns on reload; `/health` 200.
  - Follow-ups: there are no indexes on FK columns (`orders.brand_id`, `order_application.orderId`, `message.chatId`, …); add them with the list pagination work (2.5). In the redesign, EditProfile should load `/profiles/me`. Today it prefills from the `/auth/profile` JWT claims, so the profile fields start empty and a save sends empty categories and bio.
- [x] 1.5 ∥ i18n setup: `react-i18next`, RU (default), KZ and EN locale files, language switcher, backend error codes instead of English strings. Extract the existing strings.
  - `src/i18n`: namespaces in `locales/<lang>/<ns>.json` (loaded with `import.meta.glob`), RU default, Kazakh = `kk` (labelled KZ), choice in localStorage `lang` and `<html lang>`; `formatDate`/`formatTime`/`formatNumber`/`formatMoney` (₸). `LanguageSwitcher` on Login, Register, the dashboard sidebar and Settings (replaces the old language dropdown; `language` dropped from the locally saved settings).
  - Backend: `ErrorCode` enum + `apiError()`; `HttpErrorFilter` returns `{statusCode, code, message, details?}`. Frontend `getErrorMessage(err, fallback?)`: known code → translated text, no response → NETWORK, else the page fallback or UNKNOWN. Every `err.response?.data?.message` / `error.message` toast in pages and AuthContext now goes through it (services had none).
  - Translated: auth (Login, Register, NotFound), brand, influencer, messages, profile, settings, App loader, StatusBadge. **Translated in the redesign:** Landing, EditProfile (error toast already uses `getErrorMessage`), statistics LineChart/PieChart (the `landing` and `stats` locale files exist, unused until then). **Not translated, removed in Phase 2:** Matches, MatchDetail, UpdateStatsModal. Dead files left alone: brand/Messages, ChatWindow, InfluencerCard, FilterSection, RangeFilter, LoadingSpinner, services brands/influencers/collaborations/settings.
  - Checks (frontend): `tsc --noEmit` ok · `eslint src` 0 errors / 1 warning (react-refresh, AuthContext) · Vitest `Test Files 4 passed (4)` / `Tests 11 passed (11)` (key parity across en/ru/kk per namespace, every backend `ErrorCode` has a translation, fallback order) · `vite build` ok.
  - Browser QA (Docker nginx build, headless Chrome, disposable `qa-*@example.test` users seeded through the API): 25/25. Login page defaults to RU (`<html lang=ru>`); KZ and EN switch the login and brand dashboard headings and survive a reload; a wrong password shows the RU `AUTH_INVALID_CREDENTIALS` text; the landing page is still English; brand orders, brand and influencer message threads, influencer orders and applications load; the influencer's reply appears; Settings has the switcher and no language `<select>`. Only console error: the deliberate wrong-password 401 (Google Fonts CSP filtered).
  - Found in QA: Settings saved both notification switches as off on every save (Chakra's Switch submits an empty value, the code compared with `'on'`). Fixed with `formData.has()`.
- Branching (2026-10-03): PR #1 is unmerged, so Phase 1 is stacked on `audit/fixes`: one branch per step (`phase1/node24` → `phase1/ci` → `phase1/vite` → `phase1/i18n` → `phase1/migrations`), each PR based on the previous branch.
- **Done when:** CI is green on `main`; a fresh Postgres plus `migration:run` boots production mode; the UI switches RU/KZ/EN.

### Phase 1 review (2026-10-04, stack `phase1/node24` … `phase1/migrations`)

**Done-when status:** CI green on every PR that has the workflow (below; `main` itself waits for the stack to merge into `v1`) ✅ · fresh Postgres + `migration:run` boots production mode ✅ (1.4 proof, 2026-10-03) · UI switches RU/KZ/EN ✅ (1.5 browser QA 25/25).

**CI per PR** (GitHub Actions `CI`, `pull_request` runs on the PR head):
- #1 `audit/fixes` → `v1` (`a9e1d4d`) and #2 `phase1/node24` → `audit/fixes` (`20f908c`): no run, the workflow arrives in #3.
- #3 `phase1/ci` (`43d34d0`) success · #4 `phase1/vite` (`16155b6`) success · #5 `phase1/i18n` (`d867868`) success · #6 `phase1/migrations` (`d5d0deb`, then `debcabc` with the review fixes) success.

**Final checks (host Node v25, `phase1/migrations` after the review fixes):**
- Backend: `tsc --noEmit` ok · `npx eslint "{src,apps,libs,test}/**/*.ts"` 0 problems · Jest `Test Suites: 14 passed, 14 total` / `Tests: 62 passed, 62 total` · `nest build` ok.
- Frontend: `tsc --noEmit` ok · `eslint src` `✖ 1 problem (0 errors, 1 warning)` (react-refresh, AuthContext) · Vitest `Test Files 4 passed (4)` / `Tests 11 passed (11)` · `vite build` ok (1.25 MB chunk warning).

**Review** (code reviewer on the Phase 1 diff): "approve with comments", no high items. Fixed:
- `b569efc` regression from 1.5: the catch-all `HttpErrorFilter` turned body-parser errors into 500. Exposed 4xx `http-errors` keep their status now (live on the dev stack: body > 100 kB → 413, malformed JSON → 400, no token → 401); no write after headers are sent. New spec case.
- `32f20f7` `?category=` Raw param renamed `:profileCategory` (unique name in the query) and the input trimmed.
- README: runbook for a database created by `synchronize` (mark the Baseline applied by hand) and for the `uuid-ossp` extension on managed Postgres.

**Follow-ups (placed in the redesign plan below):** EditProfile loads `/profiles/me`; field-level ValidationPipe `details` in forms; FK indexes with pagination; auth refresh `catch` turns DB errors into 401; optional `DB_MIGRATIONS_RUN` kill switch; `PAYLOAD_TOO_LARGE` error code with uploads; OrderDetail `toast()` during render; nginx `client_max_body_size` for uploads; route code-splitting; react-router 7 and NestJS 11 audit items; `landing`/`stats` locale files unused until the redesign.

## Redesign — Phases 2–6 merged into one PR stack (approved 2026-10-04)

Source: full UI redesign decided 2026-10-03; mockups in `~/Downloads/Diploma project UI mockups/` (`AdPartners Redesign.dc.html`), direction "Liquid Glass" / Apple HIG (tokens recorded in the 2026-10-03 redesign brief). This section replaces the old Phases 2–6; their steps are mapped below (old step → PR).
Branching: stacked after `phase1/migrations`, one branch per PR (`redesign/1-shell` → `redesign/2-deals` → …), each PR based on the previous branch, CI green before the next starts.
Rules for every PR:
- Ships something usable on its own: pages not yet redesigned keep working inside the new shell.
- Every schema change is a migration generated against a database at the previous migration; `migration:generate --dr` shows no drift afterwards. Production has never been deployed, so no data migrations.
- Every new string in RU, KZ and EN (key parity test). Every new list endpoint paginated (`take`/`skip`, default 20, typed query DTO). Every new form shows field-level errors.
- Checks: both apps' typecheck, lint, tests, builds; browser QA (playwright-core, headless Chrome) of the PR's screens in RU/KZ/EN, light and dark, desktop and mobile width; one reviewer agent; results recorded here.

### PR R1 — Design system and app shell, Landing, Auth (old 3.1–3.4, 4.1, 4.6)
- [ ] Tokens in `theme.ts` as Chakra semantic tokens (light/dark from the brief): bg/surface/subtle/line/fg/muted, primary/accent/verified/warn with soft and ink variants, canvas gradient, chrome. Radii 22/12/999, glass chrome `blur(28px) saturate(180%)`. `brand.*` purple and every explicit `colorScheme="purple"`/`"teal"` removed.
- [ ] System font stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Display'/'SF Pro Text', system-ui`), display 700 / -0.022em. Google Fonts link removed (fixes the CSP console error).
- [ ] `prefers-reduced-transparency` (solid chrome, no blur, canvas = bg) and `prefers-contrast: more` (stronger line/muted) as global styles.
- [ ] Lint guard: no hex colours in `src/pages` and `src/components` outside `theme.ts` (old 3.x "Done when").
- [ ] App shell: desktop floating glass sidebar (inset 12, radius 26); mobile glass top bar + floating bottom tab bar (radius 32). Nav per role from the mockup `NAV`: Creator — Find briefs · My applications · Deals · Messages · Profile; Brand — per mockup (Home · Briefs · Deals · Messages · Plan); Admin — Verification. Light/Dark toggle and language switcher in the shell.
- [ ] Core components: GlassCard, StatusPill (green / warn / blue verified / gray / red), ScoreRing, VerifiedBadge, CreatorCard, BriefCard, Stepper, KpiTile, EmptyState, PageHeader, SegmentedControl.
- [ ] Landing (hero "Local creators pitch your brief within 48 hours", 3 steps) using the `landing` locale files; Sign up / Log in with role cards.
- [ ] Route code-splitting (`React.lazy` per route group) → removes the 1.25 MB single chunk.
- [ ] `getErrorMessage` companion `getFieldErrors(err)` reading ValidationPipe `details`; used by Sign up / Log in.
- [ ] Backend: auth refresh `catch` rethrows non-auth errors (DB errors are no longer 401 `AUTH_INVALID_TOKEN`), with a test.
- [ ] `App.test.tsx` updated for the new hero.
- **Done when:** Landing, Auth and the shell match the mockup in both themes on desktop and mobile; no Google Fonts request; main chunk below the 500 kB warning.

### PR R1b — Email verification code on Sign up (old 7.2 part; moved forward 2026-10-04)
- [ ] Mail service behind an interface: SMTP via `nodemailer` (env `SMTP_*`, `MAIL_FROM`); dev compose adds a Mailpit container (UI on localhost) so codes are visible locally; tests use an in-memory fake. Production provider chosen with D2.
- [ ] `users.emailVerifiedAt`; `email_verification` table: SHA-256 hash of a 6-digit code, expires in 10 min, max 5 attempts, one active code per user. Migration marks existing users verified.
- [ ] Register creates the user and sends the code, and returns no tokens. `POST /auth/verify-email` (email + code) issues the tokens. `POST /auth/resend-code` (60 s cooldown, throttled per IP). Login of an unverified user → 403 `AUTH_EMAIL_NOT_VERIFIED`; the UI opens the code step and resends. Generic responses so registered emails are not revealed.
- [ ] Code email in RU/KZ/EN (user's chosen language); new error codes translated.
- [ ] Sign up flow: role card → details → 6-digit code input (paste, auto-advance, resend timer).
- [ ] Tests: code expiry, attempt limit, wrong code, resend cooldown, no tokens before verification.
- **Done when:** a new account receives the code in Mailpit and cannot log in until it enters it.

### PR R2 — One Deal pipeline; Match and Collaboration removed; admin account (old 2.1–2.4)
- [ ] ADR `docs/adr/0001-deal-pipeline.md`: Brief → Application → Deal lifecycle, Mermaid state diagrams.
- [ ] `Deal` entity (one per accepted application): order, brand profile, creator profile, agreed price, deliverables, post-by date, status. Transition table in one service: ACTIVE → PROOF_SUBMITTED → COMPLETED | DISPUTED; ACTIVE → CANCELLED. The mockup stepper Accepted → Creating → Proof sent → Completed maps onto it. Unit tests for every allowed and forbidden transition.
- [ ] Accept transaction creates the Deal instead of upserting a Match.
- [ ] Remove the Match, Collaboration, matching-recommendation and Statistics modules and their pages/components (Matches, MatchDetail, UpdateStatsModal, InfluencerList, BrandList, BrandRecommendations, statistics charts, `recharts`). Migration drops their tables. `matchScore()` stays as a pure function reading `Profile.metrics` / `followersCount`, with tests.
- [ ] D5 on every participant path: no counterparty email in `/order-applications*`, `/orders/brand`, `/orders/influencer`, participant `GET /orders/:id`, deals. `POST /chats/:recipientId` only for pairs that share an application or deal. Admin `PATCH /order-applications/:id` can no longer edit message/price. Applicants keep access to their order detail after it leaves OPEN.
- [ ] Admin account: CLI script (`npm run admin:create -- <email>`, also runnable from `dist` in the production image).
- [ ] Optional `DB_MIGRATIONS_RUN` env kill switch (defaults to on in production).
- [ ] Frontend: Deals list and Deal page (stepper, side panel: price, "payment off-platform", deliverables, post-by date); proof actions arrive in R5.
- **Done when:** no Match/Collaboration code or tables remain; every deal status change goes through the transition table; accept → deal visible to both sides.

### PR R3 — Brief model, wizard, creator feed and apply, Applicants (old 2.5, 4.2–4.4)
- [ ] Order (brief) fields: goal, platform, format, city, `budgetMin`/`budgetMax` (₸, int), deliverables, post-by date (`date`, replaces the `deadline` varchar), `publishedAt`. DRAFT used. Endpoints: `PATCH /orders/:id` (owner, DRAFT/OPEN), publish, cancel.
- [ ] Application: `shortlisted` flag + endpoint; applicants ranked by `matchScore` server-side.
- [ ] Pagination with typed query DTOs on every list endpoint; migration adds indexes on FK columns (`orders.brand_id`, `order_application.orderId` / applicant, `message.chatId`, chat participants, deals).
- [ ] Brand: Briefs list, Brief wizard (Goal · Content · Budget · Creators · Review, live preview card, Save Draft, field-level errors), Applicants (Feed / Compare (shortlisted) / One by One; score ring, Verified badge, content strip, pitch, price, Shortlist / Accept; "Verified only" shown as a Pro control, enforced in R4).
- [ ] Creator: Brief feed (niche chips, time left, applied count), Apply (pitch + price), My applications.
- [ ] Old CreateOrder, brand/influencer Orders and OrderDetail removed (also removes the `toast()` call during render). Dead files removed: brand/Messages, ChatWindow, InfluencerCard, FilterSection, RangeFilter, LoadingSpinner, services brands/influencers/collaborations/settings.
- **Done when:** a new brand posts a brief in under 3 minutes (timed run); a creator applies from a phone-width browser; the brand shortlists and accepts from the Applicants views.

### PR R4 — Uploads, creator stats and verification queue, Plan and paywall (old 4.5, 5.1–5.4)
- [ ] Storage interface with a local private disk volume implementation (D4; S3-compatible KZ storage later with D2). Multer with type (jpeg/png/webp, magic-byte check) and size limits; files served only through an auth-checked endpoint (owner, admin; portfolio images public). nginx `client_max_body_size` raised for the upload route. `PAYLOAD_TOO_LARGE` error code (+ ru/kk/en).
- [ ] Creator stats: claimed followers/engagement + insights screenshot → review queue. Admin queue: claimed stats next to the screenshot, approve ("Approve and Lock Stats", sets `verifiedAt`) or reject with a reason; resubmitting clears the badge. Audit log table for admin actions (who changed what).
- [ ] Portfolio images for the content strip: up to 6 per creator (decided 2026-10-04).
- [ ] Plan: `plan` (FREE/PRO) + `proExpiresAt` on the brand; admin sets the plan; the effective plan is computed on read (expired Pro = Free, no cron needed). Plan page: Free vs Pro (₸19 900/month), Kaspi transfer instructions.
- [ ] "Verified only" enforced server-side for Pro; Free gets an upgrade prompt.
- [ ] Test period (D3): env `FREE_TEST_PERIOD=true` (default during the test) makes every brand's effective plan Pro; the Plan page shows the price with "free during the test period" and no payment step. Turning it off restores the paywall with no code change (test both ways).
- **Done when:** a Free brand cannot get verified-only results through the API (test); an admin upgrade takes effect immediately; a rejected screenshot shows its reason to the creator.

### PR R5 — Deal proof, confirm or dispute, two-way ratings (old 6.1–6.3)
- [ ] Creator submits a proof link + optional screenshot (R4 storage) → PROOF_SUBMITTED. Brand: Confirm Completion → COMPLETED, Report a Problem → DISPUTED (admin moderation list).
- [ ] Ratings (1–5 + comment), one per deal per side after COMPLETED; averages on profiles.
- [ ] Backend e2e test of a whole deal (register → brief → apply → accept → proof → confirm → ratings) against Postgres; CI gets a Postgres service container for it.
- **Done when:** the e2e test passes in CI.

### PR R6 — Brand Home, Creator profile, Messages, Settings/EditProfile, dark mode, a11y and mobile QA
- [ ] Brand Home: KPIs (live briefs, new applicants, active deals, waiting on you), briefs with the 48 h goal bar (≥ 3 applicants within 48 h of `publishedAt`, the north-star metric), "Needs you" list. One summary endpoint. Old dashboards removed.
- [ ] Creator profile: verified stats, rating + reviews, portfolio grid.
- [ ] Messages redesigned.
- [ ] Settings / EditProfile load `/profiles/me` (not the `/auth/profile` JWT claims), field-level errors.
- [ ] Full pass: AA contrast in both themes, reduced transparency / more contrast, keyboard use, RU/KZ text length, every screen at mobile width.
- **Done when:** browser QA of every screen in RU/KZ/EN, light and dark, desktop and mobile passes; no page from the old UI remains.

### After the redesign (not in R1–R6)
- Dependency majors: react-router 7 (2 moderate advisories), NestJS 11 / swagger 11 / typeorm 11 / bcrypt 6 (backend audit 17). One PR each, before Phase 8.
- Phase 7: the mobile notification bell from the mockups (the email code moved to R1b).

### Decisions for this plan (2026-10-04)
- [x] D3: free test version, nobody is charged; price kept as designed (see D3 above).
- [x] D4: local private volume behind a storage interface.
- [x] Content strip: creator-uploaded portfolio images, up to 6.
- [x] Plan approved, with the 6-digit email code moved into R1b.

## Phase 7 — Notifications (Needs: R2)
- [ ] 7.1 Notification table plus an in-app bell (WebSocket push; unread count fixed per recipient).
- [ ] 7.2 Email (on the R1b mail service): password reset (also an auth gap), new applicant, deal updates. Templates in RU/KZ/EN.
- [ ] 7.3 Telegram bot: users link their account with a deep-link code; notifications as in 7.2; per-channel on/off in Settings.
- **Done when:** a brand gets a Telegram message within 1 minute of a new applicant.

## Phase 8 — Metric, launch, operations (Needs: D2)
- [ ] 8.1 Event tracking (in the Postgres `events` table, no third-party): brief_posted, application_created, deal_*; admin dashboard showing **the share of briefs with ≥ 3 applicants in 48h**.
- [ ] 8.2 Deploy to KZ hosting: TLS, backups (daily pg_dump, restore tested), uptime and error monitoring.
- [ ] 8.3 Legal: privacy policy and terms in RU/KZ, consent to personal-data processing at signup.
- [ ] 8.4 Brands-first seeding: admin tools to create brand accounts for onboarding calls; demo seed data kept out of production.
- **Done when:** the first 5 real brands are live and the north-star metric is reported weekly.

## Dependency graph (short)
```
P0 → P1 → R1 → R1b → R2 → R3 → R4 → R5 → R6 → P7 → P8 (D2)
```

## Review gate (blueprint adversarial check)
- Before starting each phase: re-read PRODUCT-BRIEF anti-goals; cut any step that serves agencies, in-app payments, or social APIs.
- After each phase or redesign PR: run `code-review` on the diff; `security-review` on P0, R2 (D5 email paths), R4 (uploads, paywall) and P7; record the result here.

---

# Audit Remediation — Approved Implementation Plan (2026-07-14)

Scope approved after `docs/audits/PROJECT_FULL_AUDIT_AND_IMPROVEMENT_REVIEW.md` Phase 0 review. Preserve pre-existing UI/UX work; this plan owns only audit remediation.

## Phase 1 — Token boundary (P0)
- [x] Add explicit access/refresh JWT token types and enforce them for REST, refresh, and Socket.IO.
- [x] Add auth/gateway regression tests for valid, refresh, malformed, and expired tokens.
- [x] Verify backend typecheck and focused tests (`tsc --noEmit`, 8 focused tests passed).

## Phase 2 — Core flows (P1)
- [x] Repair influencer Express Interest payload, state, and feedback without trusting client identity.
- [x] Fix recommendation profile link, match completion mutation, and authenticated nested 404s.
- [x] Add frontend smoke test and verify production build (`npm ci`, Jest, TypeScript, build passed; pre-existing lint warnings remain in unrelated pages).

## Phase 3 — Identity and integrity (P1)
- [x] Standardize order service contracts on authenticated User ID resolving to canonical Profile FK values.
- [x] Safely retire duplicate legacy order-apply route with an explicit HTTP 410 migration response.
- [x] Add unique order/application constraint and transactional duplicate/race handling.
- [ ] Add migration infrastructure and a complete baseline migration; migration CLI and uniqueness migration exist, but baseline generation is blocked until a disposable PostgreSQL daemon is available.

## Phase 4 — Filters, analytics, and production safety (P1)
- [x] Align profile search queries with stored types and remove nonexistent property references.
- [x] Add validated statistics DTO.
- [x] Disable production synchronize; add deterministic/non-root Docker build, env validation, CORS/Swagger policy, and NGINX headers.

## Phase 5 — Verification and documentation (P1)
- [x] Add non-mutating scripts and practical isolated tests; record real results only.
- [x] Synchronize README and directly affected technical/diploma docs.
- [x] Append implementation review with remaining limitations and verification evidence.

## Implementation review

- Phase 1: Access and refresh JWTs now carry explicit types and use distinct production secrets; REST and Socket.IO tests reject refresh, malformed, and expired tokens.
- Phase 2: Influencer interest derives the identity server-side; profile navigation, completion mutation, and nested 404s are wired and covered by service tests.
- Phase 3/4: Order profile-FK resolution, application uniqueness/race handling, simple-array-safe profile filters, and strict stats validation are implemented. A complete schema baseline migration remains blocked by unavailable Docker/PostgreSQL in this environment.
- Phase 5: `backend` typecheck plus 24 unit tests pass; `frontend` clean install, typecheck, two Jest suites/three tests, and production build pass. Frontend build retains unrelated existing unused-variable warnings.

## Local Docker deployment — requested 2026-07-14

- [x] Inspect Docker availability and compose environment without printing secrets.
- [x] Build and start the local development compose stack.
- [x] Verify container state, backend health/API reachability, and frontend HTTP response.
- [x] Record deployment result and any environment/runtime blockers.

Deployment review: Docker Desktop was started, current backend/frontend images were rebuilt, and the existing local Compose services were recreated without deleting the PostgreSQL volume. On 2026-07-14, PostgreSQL and backend report healthy; `GET http://localhost:3005/health` and `GET http://localhost:3000/` both returned HTTP 200. This is a local development deployment only (`NODE_ENV=development` and entity synchronization); production deployment remains blocked by the unverified complete baseline migration.

## Registration failure — requested 2026-07-14

- [x] Inspect the live backend logs, frontend API base URL, and registration contract.
- [x] Reproduce with a disposable local account and identify the root cause.
- [x] Apply the smallest compatible fix and rebuild/restart the affected service.
- [x] Verify successful registration and record the result.

Root cause: the public registration API succeeded, but the local Compose CORS allow-list accepted only `http://localhost:3000`. A browser using `http://127.0.0.1:3000` was blocked before the request reached Nest. Development Compose now allows both loopback origins; production stays fail-closed through its explicit `CORS_ORIGIN` value.

Verification: after recreating the backend, CORS preflight returned the matching allow-origin header for both local URLs. A registration request with origin `http://127.0.0.1:3000` returned HTTP 201. Disposable verification accounts were then deleted through the authenticated account-deletion endpoint; the database confirms no `signup-*@example.test` test users remain.

# Prior UI/UX Redesign — Implementation Plan (2026-06-10)

Prior audit-fix plan complete — see git history (fa98eed and earlier).

## Phase A — Documentation
- [ ] docs/UI_UX_AUDIT.md — full audit with severity
- [ ] docs/PRODUCT_STRUCTURE.md — personas, IA, navigation
- [ ] docs/DESIGN_SYSTEM.md — typography, color, spacing, radius, shadows, motion
- [ ] docs/THEMING.md — light/dark token strategy
- [ ] docs/COMPONENT_LIBRARY.md — shared component contracts
- [ ] docs/RESPONSIVE_STRATEGY.md — breakpoints, adaptive nav
- [ ] docs/ACCESSIBILITY_AUDIT.md — WCAG AA findings + fixes
- [ ] docs/UI_PERFORMANCE.md — rendering, bundle, CLS

## Phase B — Foundation (code)
- [ ] theme.ts → Design System 2.0: semantic tokens, dark mode, typography scale, component variants, shadows
- [ ] index.tsx → ColorModeScript for theme persistence + system detection
- [ ] index.css → font loading (Inter)
- [ ] App.tsx → branded full-screen loading state, real 404 (NotFound page)

## Phase C — Shared components
- [ ] components/ui/StatusBadge.tsx — single status→color mapping (kills 8x duplication)
- [ ] components/ui/StatCard.tsx — KPI card for dashboards
- [ ] components/ui/PageHeader.tsx — title + subtitle + actions
- [ ] components/ui/EmptyState.tsx — icon + title + description + CTA
- [ ] components/ui/CardSkeleton.tsx — skeleton loaders (cards + stats)

## Phase D — Navigation shell
- [ ] DashboardLayout → responsive (Drawer on mobile + hamburger topbar), theme toggle, user section + logout, fixed active-state logic, semantic colors

## Phase E — Page refactors
- [ ] Matches.tsx — skeleton, empty state, StatusBadge
- [ ] brand/Dashboard.tsx + influencer/Dashboard.tsx — StatCard, skeletons
- [ ] Messages.tsx — dark-mode-safe colors
- [ ] Profile.tsx — dark-mode-safe badge, semantic colors
- [ ] brand/Orders.tsx, influencer/Orders.tsx, MyApplications.tsx — StatusBadge + EmptyState
- [ ] Cleanup: delete dead components (ChatWindow, FilterSection, RangeFilter, InfluencerCard, LoadingSpinner)

## Phase F — Verify
- [ ] npm run build passes
- [ ] Review summary appended here
