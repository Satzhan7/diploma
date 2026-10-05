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
- [x] **D3 — Pro price and Free limits (decided 2026-10-04).** The platform runs as a **free test version**: nobody is charged. The Plan model, Plan page and the Pro price (₸19 900/month, Free = unlimited briefs) stay as designed. Revised 2026-10-05: the test-period switch no longer gives every brand Pro; during the test a brand gets Pro (30 days) through a real checkout for 0 ₸, and nobody is charged. With the switch off, the paid path is a Kaspi transfer, then an admin sets Pro in /admin/brands (no payment provider) (R4).
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

### PR R1 — Design system and app shell, Landing, Auth (old 3.1–3.4, 4.1, 4.6) — branch `redesign/1-shell`
- [x] Tokens: `--ap-*` CSS variables in `frontend/src/index.css` (light, `:root[data-theme='dark']`, `prefers-contrast: more`, `prefers-reduced-transparency: reduce`); Chakra semantic tokens in `theme.ts` point at them (bg/fg/border kept for old pages, plus primary/success/verified/warn/danger with soft/ink, chrome). Radii 22/12/full, `glass` and `card` layer styles. Purple scale replaced by a blue `brand` scale; `colorScheme="brand"` buttons use the semantic primary in both modes.
- [x] System font stack, display 700 / -0.022em; Google Fonts removed (no font request, no CSP error).
- [x] Lint guard (`no-restricted-syntax`): no hex colours, palette shades or purple/teal/green/blue schemes in pages/components (Logo artwork and the three files removed in R2/R3 exempt). Existing pages moved to tokens.
- [x] App shell (`AppShell.tsx`, replaces DashboardLayout): floating glass sidebar; mobile glass top bar (account menu, page title, theme) + floating tab bar. Brand: Home · New brief · Briefs · Deals · Messages (tab bar drops New brief, as in the mockup); Creator: Find briefs · My applications · Deals · Messages · Profile. Deals points at the old Matches page until R2, Applicants arrives in R3, Plan in R4, admin nav in R4. Creators now land on Find briefs. Skip link.
- [x] Components: StatusPill (tones success / warn / verified / neutral / primary / danger; rejected uses the HIG red, not the mockup's blue), ScoreRing, VerifiedBadge, SegmentedControl; StatusBadge and LanguageSwitcher rebuilt on them. CreatorCard, BriefCard, Stepper and KpiTile move to the PRs that first use them (R3, R2, R6).
- [x] Landing (`landing` namespace rewritten in RU/KZ/EN): hero, example applicants with ScoreRing, three steps; "Free during the test period."
- [x] One `Auth` page for `/login` and `/register`: Sign up / Log in segmented tabs, role cards (`?role=` preselects), inline field errors, form-level error alert, sign-in right after sign-up (R1b adds the code step). The mockup's "82% of briefs…" stat is not shown (no real data); the panel states the goal instead.
- [x] Route code-splitting: every page is a lazy chunk; main bundle 217 kB, no size warning (recharts, 408 kB, only loads on the old dashboards until R2).
- [x] Backend: `details: [{ field, rule, message }]` from a ValidationPipe `exceptionFactory`; frontend `getFieldErrors()` translates `errors:validation.<rule>`. Register: name required (≤ 100), password ≥ 8.
- [x] Backend: refresh only maps JWT failures to 401; DB errors propagate (test fails on the old code).
- [x] `App.test.tsx` checks the new hero and CTA link.
- Checks: backend `tsc` ok · eslint 0 · Jest `15 passed` / `64 passed` · `nest build` ok. Frontend `tsc` ok · eslint 0 errors / 1 warning · Vitest `4 passed` / `13 passed` · `vite build` ok.
- Browser QA (Docker stack, headless Chrome, `qa-r1-*@example.test` users removed afterwards, 0 left): 28/29. Landing RU default, KZ/EN switch, no Google Fonts request, system font; dark mode from the OS (`--ap-surface` #1c1c1e), no horizontal scroll at 390 px; empty sign-up shows RU field errors; brand sign-up → `/brand/dashboard` with the glass sidebar (`blur(28px)`), EN switch, longest-prefix active item; brand mobile tab bar without New brief; creator sign-up (dark, mobile) → Find briefs with five tabs; wrong password → inline RU error; `prefers-contrast: more` → `--ap-line` #aeaeb2. The one "failure" is Chrome logging the deliberate 400 of the empty sign-up. Not testable in Chrome: `prefers-reduced-transparency` (no emulation).
- Review (one reviewer agent): approve with comments, no high items. Fixed in `46f5021`: (1) sign-up stored no tokens and sent a second login request; it now uses the tokens `/auth/register` returns; (2) role cards were buttons, now native radios (Chakra `useRadio`/`useRadioGroup`, arrow keys); (3) errors stayed after switching Log in / Sign up, now cleared on mode change; (4) errors without a visible field (e.g. `role`) were swallowed, now the form alert shows them. (5) No `validation.whitelistValidation` string: covered by the form alert's generic message. Browser re-test found one more: Chakra's radio box is `aria-hidden`, so the radios had no accessible name; fixed with `aria-labelledby` / `aria-describedby` and a Vitest check.
- Re-checks after the fixes: frontend `tsc` ok · eslint 0 errors / 1 warning · Vitest `4 passed` / `14 passed` · `vite build` ok. Browser QA 22/22: brand and creator sign-up each send only `POST /auth/register` and store tokens; role radios named, ArrowRight/ArrowLeft switch role and move focus, name label follows the role; field errors clear on switching to Log in; wrong password shows the RU alert, which clears on switching to Sign up; log in still works. `qa-r1-*` users removed, 0 left.
- PR #7 (`redesign/1-shell` → `phase1/migrations`): CI green at `6b83a35`.
- **Done when:** Landing, Auth and the shell match the mockup in both themes on desktop and mobile; no Google Fonts request; main chunk below the 500 kB warning.

### PR R1b — Email verification code on Sign up (old 7.2 part; moved forward 2026-10-04)
- [x] Mail service behind an interface: SMTP via `nodemailer` (env `SMTP_*`, `MAIL_FROM`); dev compose adds a Mailpit container (UI on localhost) so codes are visible locally; tests use an in-memory fake. Production provider chosen with D2.
- [x] `users.emailVerifiedAt`; `email_verification` table: SHA-256 hash of a 6-digit code, expires in 10 min, max 5 attempts, one active code per user. Migration marks existing users verified.
- [x] Register creates the user and sends the code, and returns no tokens. `POST /auth/verify-email` (email + code) issues the tokens. `POST /auth/resend-code` (60 s cooldown, throttled per IP). Login of an unverified user → 403 `AUTH_EMAIL_NOT_VERIFIED`; the UI opens the code step and resends. Generic responses so registered emails are not revealed.
- [x] Code email in RU/KZ/EN (user's chosen language); new error codes translated.
- [x] Sign up flow: role card → details → 6-digit code input (paste, auto-advance, resend timer).
- [x] Tests: code expiry, attempt limit, wrong code, resend cooldown, no tokens before verification.
- **Done when:** a new account receives the code in Mailpit and cannot log in until it enters it. ✅
- As built (`redesign/1b-email-code`, PR #8 on #7): `users.isEmailVerified` became `emailVerifiedAt` (existing users backfilled from `createdAt`); `email_verification` also keeps `sendCount`/`windowStartedAt` for a cap of 10 codes per account per 24 h. Register answers `202 { verificationRequired: true }` for every email; verify-email takes `{ email, code, password }` and sets the password (the inbox owner chooses it); every verify failure is `AUTH_CODE_INVALID`. The code email goes out in the background. Email lookup is case-insensitive. Dev databases on `synchronize` need `UPDATE users SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL` once (or the seed).
- Checks: backend `tsc` ok · eslint 0 · prettier ok · Jest `16 passed` / `78 passed` · `nest build` ok. Migration on a fresh DB at the Baseline: up → `--dr` no drift → down → up. Frontend `tsc` ok · eslint 0 errors / 1 warning · Vitest `4 passed` / `14 passed` · `vite build` ok (main entry 338 kB: Rolldown merged an already-preloaded chunk; first-load JS 771 298 → 771 370 bytes).
- Browser QA (Docker + Mailpit, headless Chrome) 39/39: RU desktop, EN mobile dark, KZ; code from the Mailpit API; wrong code → generic error, fields cleared, focus back; backspace; paste; typed code; unverified login → 403 → resend → code step, no second mail within 60 s; taken email → same step, no mail; "Change email"; upper-case email logs in; browser hijack scenario (attacker registers first, victim verifies → attacker's password 401, victim's 200). `qa-r1b-*` users and Mailpit messages removed, 0 left.
- Review (one reviewer agent): request changes. Fixed in `4ce45a1`: (1, high) pre-registration hijack — verify sets the inbox owner's password, re-register updates name/role/profile type; (2) verify errors revealed pending sign-ups — now all `AUTH_CODE_INVALID`; (3) register timing — mail in the background, dummy bcrypt on a taken email; (4) resend reset the attempts without limit — 10 codes/account/day; (6) code deleted before the user was marked verified — order swapped; (7) case-sensitive email lookup — `LOWER()` match; (8) spam/log-in hint. Not changed: (5) the cooldown read-then-write can send two mails under concurrent resends — bounded by the per-IP throttle, the code is replaced each time.


### PR R2 — One Deal pipeline; Match and Collaboration removed; admin account (old 2.1–2.4)
- [x] ADR `docs/adr/0001-deal-pipeline.md`: Brief → Application → Deal lifecycle, Mermaid state diagrams.
- [x] `Deal` entity (one per accepted application): order, brand profile, creator profile, agreed price, deliverables, post-by date, status. Transition table in one service: ACTIVE → PROOF_SUBMITTED → COMPLETED | DISPUTED; ACTIVE → CANCELLED. The mockup stepper Accepted → Creating → Proof sent → Completed maps onto it. Unit tests for every allowed and forbidden transition.
- [x] Accept transaction creates the Deal instead of upserting a Match.
- [x] Remove the Match, Collaboration, matching-recommendation and Statistics modules and their pages/components (Matches, MatchDetail, UpdateStatsModal, InfluencerList, BrandList, BrandRecommendations, statistics charts, `recharts`). Migration drops their tables. `matchScore()` stays as a pure function reading `Profile.metrics` / `followersCount`, with tests.
- [x] D5 on every participant path: no counterparty email in `/order-applications*`, `/orders/brand`, `/orders/influencer`, participant `GET /orders/:id`, deals. `POST /chats/:recipientId` only for pairs that share an application or deal. Admin `PATCH /order-applications/:id` can no longer edit message/price. Applicants keep access to their order detail after it leaves OPEN.
- [x] Admin account: CLI script (`npm run admin:create -- <email>`, also runnable from `dist` in the production image).
- [x] Optional `DB_MIGRATIONS_RUN` env kill switch (defaults to on in production).
- [x] Frontend: Deals list and Deal page (stepper, side panel: price, "payment off-platform", deliverables, post-by date); proof actions arrive in R5.
- **Done when:** no Match/Collaboration code or tables remain; every deal status change goes through the transition table; accept → deal visible to both sides.
- Implementation checklist (2026-10-04, from the code map):
  - [x] Backend `deals/`: `Deal` entity (`deals` table: `orderId`, unique `applicationId`, `brandProfileId`, `creatorProfileId`, `agreedPrice` int, `deliverables` text, `postBy` date, `status` enum), `deal-transitions.ts` table + spec, `DealsService` (create in the accept transaction, `findForUser` paginated, `findOneForUser`, `changeStatus` compare-and-set), `DealsController` (`GET /deals`, `GET /deals/:id`), `toDealView` without emails.
  - [x] Accept transaction: Match upsert → `deals.createForApplication(manager, …)` (idempotent on `applicationId`); `OrderApplicationsService` loses the Match repo (both specs updated).
  - [x] Delete `matching/`, `collaborations/`, `statistics/`; User `brandMatches`/`influencerMatches`; `UsersService.findInfluencers/findBrands` and `ProfilesService.find*ByCategories` if unused; app.module + data-source entries. `matchScore()` pure function in `profiles/match-score.ts` (Profile.categories/languages/contentTypes/metrics/followersCount) + spec.
  - [x] Migration `DealPipeline`: create `deals`, drop `match`, `collaboration` and their enums.
  - [x] D5: participant order/application responses through one `toParticipantOrder`/`toPublicUser` mapping; tests for each route. Applicants keep `GET /orders/:id`. Admin PATCH: message/price → 403. `POST /chats/:recipientId`: self → 400, no shared application → 403 `CHAT_NOT_ALLOWED`.
  - [x] `scripts/create-admin.ts` (+ `admin:create`, `admin:create:prod`), README runbook. `DB_MIGRATIONS_RUN` in configuration.ts, .env.prod.example, docs/ENVIRONMENT_VARIABLES.md.
  - [x] Frontend: delete Matches, MatchDetail, UpdateStatsModal, InfluencerList, BrandList, BrandRecommendations, statistics components/services/types, matching/collaborations/brands/influencers services, `stats` namespace if unused, `recharts`; dashboards without statistics; Profile "connect" action removed. New `services/deals.ts`, `pages/Deals.tsx`, `pages/Deal.tsx`, `ui/BriefCard`, `ui/Stepper`, `deals` namespace RU/KZ/EN; routes `/brand/deals[/:id]`, `/influencer/deals[/:id]`; NAV re-pointed.
  - [x] Checks, browser QA, PR, review (see the R2 prompt steps 8–11).
- As built (`redesign/2-deals`, PR #9 on #8, commits `c78ae20`..`aba4cba`): one `deals` table (unique `applicationId`), transitions in `deal-transitions.ts`; the accept transaction creates the deal and rejects the other applications; `match`, `collaboration` and the statistics tables dropped by hand-written DROPs in the migration (down recreates them from the Baseline). `matchScore()` kept in `profiles/match-score.ts` for R3.
- Checks (at `721a622`): backend `tsc` ok · eslint 0 · prettier ok · Jest `19 passed` / `139 passed` · `nest build` ok. Frontend `tsc` ok · eslint 0 errors / 1 warning · Vitest `16 passed` · `vite build` ok; first-load JS 771 370 → 770 078 bytes, `recharts` chunk gone. After the review fixes (`aba4cba`): Jest `20 passed` / `146 passed`; first-load JS 770 078 → 766 525 bytes.
- Browser QA (Docker, headless Chrome) 59/59, re-run after the review fixes 59/59: brand creates an order in the UI → creator applies in the UI, rival via API → accept creates one deal with the copied terms and rejects the rival; Deals list and Deal page for both sides (stepper, off-platform payment, price); Message opens the chat; dashboards show the recent deal; D5 on every path (no counterparty email in 40 captured responses and in each participant route); outsider `GET /deals/:id` 404, `GET /orders/:id` 403; rejected applicant keeps the order and may message the brand; `POST /chats` outsider 403 `CHAT_NOT_ALLOWED`, self 400 `CHAT_SELF`, bad id 400; admin made with `admin:create` logs in, admin PATCH of message/price 403; `admin:create` also run from `dist` in the production image; KZ/RU/EN, light/dark, 1280/390 without horizontal scroll or console errors. Extra API checks for the fixes 10/10 (proposedPrice 0 / −1 / 100.5 → 400, 40 000 → 201; removed search routes 404/400). `qa-*` users and Mailpit removed, 0 left.
- Review (one reviewer agent): approve with comments, no high-severity items. Fixed in `aba4cba`: (1) accept did not refresh `['deals']`/`['chats']`, so Deals and the dashboards missed a new deal for up to 30 s; (2) `GET /deals` paging unstable on equal `createdAt` — `addOrderBy('deal.id')`; (3) `proposedPrice` accepted 0 and a decimal gave a database 500 — `@IsInt() @Min(1)` + DTO spec; (4) dead code from the Match removal: profile/user search endpoints, service methods, specs, unused frontend users service methods, `brandList`/`recommendations` keys. Found during QA: `/users/:id` and `/profiles/:userId` answered a non-UUID with a 500 (now reachable through the removed `/users/influencers` path) — `ParseUUIDPipe`, 400.
- Known, not fixed here: Chrome's `kk-KZ` Intl data formats dates as "2026 M10 15" and money as "₸ 75,000" (R1 formatter); fix in R6.

### PR R3 — Brief model, wizard, creator feed and apply, Applicants (old 2.5, 4.2–4.4)
- [x] Order (brief) fields: goal, platform, format, city, `budgetMin`/`budgetMax` (₸, int), deliverables, post-by date (`date`, replaces the `deadline` varchar), `publishedAt`. DRAFT used. Endpoints: `PATCH /orders/:id` (owner, DRAFT/OPEN), publish, cancel.
- [x] Application: `shortlisted` flag + endpoint; applicants ranked by `matchScore` server-side.
- [x] Pagination with typed query DTOs on every list endpoint; migration adds indexes on FK columns (`orders.brand_id`, `order_application.orderId` / applicant, `message.chatId`, chat participants, deals).
- [x] Brand: Briefs list, Brief wizard (Goal · Content · Budget · Creators · Review, live preview card, Save Draft, field-level errors), Applicants (Feed / Compare (shortlisted) / One by One; score ring, Verified badge, content strip, pitch, price, Shortlist / Accept; "Verified only" shown as a Pro control, enforced in R4).
- [x] Creator: Brief feed (niche chips, time left, applied count), Apply (pitch + price), My applications.
- [x] Old CreateOrder, brand/influencer Orders and OrderDetail removed (also removes the `toast()` call during render). Dead files removed: brand/Messages, ChatWindow, InfluencerCard, FilterSection, RangeFilter, LoadingSpinner, services brands/influencers/collaborations/settings.
- **Done when:** a new brand posts a brief in under 3 minutes (timed run); a creator applies from a phone-width browser; the brand shortlists and accepts from the Applicants views.
- Implementation checklist (2026-10-04, from the code map):
  - [x] Order entity: drop `budget`, `deadline`; add `goal` enum (launch/traffic/followers/event), `platform` enum (instagram/tiktok/youtube), `formats` simple-array (reel/stories/post/video/short), `city` (almaty/astana/shymkent/any), `languages` simple-array (kk/ru/en), `budgetMin`/`budgetMax` int, `deliverables` text, `postBy` date, `publishedAt` timestamptz. Draft fields nullable (`description`, `category`, `requirements` too); publish checks completeness and answers `VALIDATION_FAILED` with field details (`isNotEmpty`, `budgetRange`, `futureDate`).
  - [x] Orders API: `POST /orders` creates a DRAFT; `PATCH /orders/:id` (owner, DRAFT/OPEN; an OPEN brief stays complete); `POST /orders/:id/publish` (DRAFT → OPEN, `publishedAt`); `POST /orders/:id/cancel` (DRAFT/OPEN → CANCELLED, pending applications rejected). `GET /orders/available` = creator feed (OPEN, filters category/platform/city, newest first, `applicationsCount`, `hasApplied`); `GET /orders/brand` (status filter, `applicationsCount`/`pendingCount`, no applicant list); `GET /orders/influencer` paginated. Legacy `apply` + 410 route removed. New codes `ORDER_NOT_EDITABLE`, `ORDER_INVALID_TRANSITION` (+ ru/kk/en).
  - [x] Applications: `shortlisted` boolean; `PATCH /order-applications/:id/shortlist` (brand owner, PENDING); `GET /order-applications/order/:orderId` ranked by `matchScore(brief targeting over the brand profile, creator profile)`, then oldest first, `?shortlisted=true`, paginated, each item with the creator's public profile card and `score`. Deal copies `deliverables`/`postBy` from the brief; price falls back to `budgetMax`. `ChatsService.shareApplication` SQL unchanged (columns kept). Seed updated.
  - [x] Pagination (`PaginationQueryDto`, `Page<T>`) on `/orders/available`, `/orders/brand`, `/orders/influencer`, `/order-applications`, `/order-applications/order/:id`, `/chats`, `/chats/:id/messages` (newest page, returned oldest-first), `/users` (admin), admin debug messages. `@Index` on `orders.brand_id`, `orders.influencer_id`, `order_application."applicantId"` (`orderId` is the leading column of the unique pair), `message."chatId"`, `chat."senderId"`/`"recipientId"`.
  - [x] Migration `BriefModel` generated on `mig_r3` (deadline/budget drop + add, enum types, indexes); round trip; dev DB fix noted.
  - [x] Frontend services/types: `services/briefs.ts` (Brief, Page) replaces `services/orders.ts` + `types/order.ts`; `services/applications.ts` paginated + shortlist; status `in-progress` spelled as the backend does. `briefs` namespace RU/KZ/EN (goals, platforms, formats, cities, languages, wizard, feed, apply, applicants); validation keys `budgetRange`, `futureDate`.
  - [x] Brand pages: `Briefs` (`/brand/briefs`, status segments, publish/cancel/edit/applicants), `BriefWizard` (`/brand/briefs/new`, `/brand/briefs/:id/edit`; Goal · Content · Budget · Creators · Review, step chips, live preview `BriefCard`, Save Draft, field errors per step and from the server), `Applicants` (`/brand/briefs/:id/applicants`, `/brand/applicants` picks the latest live brief; Feed / Compare / One by One; `ui/CreatorCard`, `ScoreRing`, `VerifiedBadge` when verified (none until R4), placeholder content strip, Shortlist, Accept → deal; "Verified only" Pro control disabled until R4).
  - [x] Creator pages: `Feed` (`/influencer/briefs`: niche chips, city select, time-left badge, applied count), `Apply` (`/influencer/briefs/:id`: facts, pitch + price with field errors, sent state), `MyApplications` on the new fields and paging. Old max-budget filter gone.
  - [x] Remove CreateOrder, brand Orders, influencer Orders/OrderDetail, `types/order.ts`, `services/orders.ts`, brand/Messages, ChatWindow, LoadingSpinner, services/settings (InfluencerCard, FilterSection, RangeFilter, services brands/influencers/collaborations no longer exist); unused `brand.orders`/`createOrder`/`influencerList`, `influencer.orders`/`orderDetail` keys. NAV, routes, dashboards, Deals empty state re-pointed; Messages page on paged chats/messages.
  - [x] Checks, migration round trip, browser QA, PR, review (R3 prompt steps 8–11).
- As built (`redesign/3-briefs`, PR #10 on #9, commits `55f2da9`..`57f027a`): brief fields on `orders`, DRAFT → OPEN → CANCELLED with completeness checked on publish and on PATCH of an open brief; applicants ranked by `matchScore` server-side with `shortlisted`; `Page<T>` on every list endpoint. The `BriefModel` migration carries old rows over: budget → range, a real ISO deadline → `postBy`, incomplete open briefs → draft, `publishedAt = createdAt` for the rest.
- Checks (at `141e567`): Frontend `tsc` ok · eslint 0 errors / 1 warning · Vitest `21 passed` · `vite build` ok; first-load JS 766 525 → 779 228 bytes. After the review fixes (`57f027a`): backend `tsc` ok · eslint 0 · prettier ok · Jest `20 passed` / `168 passed` · `nest build` ok; Vitest `21 passed`; first-load JS 779 834 bytes. Migration on a fresh DB with legacy rows (`2026-02-31`, `2026-13-01`, free text, a valid ISO date, a leap day, year 0; open / in-progress / completed): up casts only the real days and moves the open rows to draft → `--dr` no drift → down → up → no drift.
- Browser QA (Docker, headless Chrome) 49/49, re-run after the review fixes 52/52: brand posts a brief through the wizard in 0.8 s automated / 17 actions (field errors per step, `budgetRange`) and Applicants shows it open at once; draft/publish/cancel/edit API rules and codes; `ORDER_EXPIRED` on the post-by day; creator finds it in the feed and applies at 390 px; ranking creator before rival; shortlist → Compare (named corner header) → Accept → deal with the brief's terms, rival declined; KZ/RU/EN, light/dark, 1280/390 without horizontal scroll, raw keys or console errors; no counterparty email in responses. Found during QA: the five-segment status filter overflowed at 390 px (`141e567`). `qa-*` users and Mailpit removed, 0 left.
- Review (one reviewer agent): approve with comments. Fixed in `ac79d06`/`57f027a`: (1) HIGH: the single brief was cached under `['brief', id]`, which the `['briefs']` refresh missed, so Applicants showed a just-published brief as a draft and a cancelled one as open — now `['briefs', 'detail', id]`; (2) old open briefs had no `publishedAt` and missing fields, hidden from the feed and not editable — backfill + back to draft; (3) the deadline cast failed on `2026-02-31` (`to_date` raises too, so a CASE-guarded day-of-month check); (4) creators could apply after the post-by date — `ORDER_EXPIRED` (+ ru/kk/en, spec); (5) Applicants could repeat a creator across offset pages — dedupe by id; (9) a wizard refetch overwrote typing — fill from the server once; (11) Compare corner cell is a `th` with a visually hidden "Metric".
- Known, not fixed here: (6) Compare shows at most 100 shortlisted creators (no paging; fine for the test period); (7) a brand can lower `budgetMax` on an open brief after creators applied, and an applicant without a proposed price is then accepted at the new maximum (deliberate: no payments in the test period); (8) editing an open brief whose `postBy` has passed is refused on any field until the date moves (deliberate: the wizard shows the `postBy` error on its step); (10) Messages "load newer" replaces the loaded page, so older messages the user scrolled to drop out — fix with the R6 Messages redesign; Applicants has no "Posted N h ago" and no creator handle (differences from the mockup, listed on the PR).

### PR R4 — Uploads, creator stats and verification queue, Plan and paywall (old 4.5, 5.1–5.4)
- [x] Storage interface with a local private disk volume implementation (D4; S3-compatible KZ storage later with D2). Multer with type (jpeg/png/webp, magic-byte check) and size limits; files served only through an auth-checked endpoint (owner, admin; portfolio images public). nginx `client_max_body_size` raised for the upload route. `PAYLOAD_TOO_LARGE` error code (+ ru/kk/en).
- [x] Creator stats: claimed followers/engagement + insights screenshot → review queue. Admin queue: claimed stats next to the screenshot, approve ("Approve and Lock Stats", sets `verifiedAt`) or reject with a reason; resubmitting clears the badge. Audit log table for admin actions (who changed what).
- [x] Portfolio images for the content strip: up to 6 per creator (decided 2026-10-04).
- [x] Plan: `plan` (FREE/PRO) + `proExpiresAt` on the brand; admin sets the plan; the effective plan is computed on read (expired Pro = Free, no cron needed). Plan page: Free vs Pro (₸19 900/month), Kaspi transfer instructions.
- [x] "Verified only" enforced server-side for Pro; Free gets an upgrade prompt.
- [x] Test period (D3, revised 2026-10-05): env `FREE_TEST_PERIOD=true` (default during the test) opens a 0 ₸ checkout (`POST /plan/checkout`, Pro for 30 days, audit row); the Plan page shows 0 ₸ with "19 900 ₸ per month after the test" and a "Get Pro for 0 ₸" button, no Kaspi step. Off: no checkout (409 `PLAN_CHECKOUT_UNAVAILABLE`), Kaspi steps, an admin sets Pro. No code change between the two (test both ways).
- **Done when:** a Free brand cannot get verified-only results through the API (test); an admin upgrade takes effect immediately; a rejected screenshot shows its reason to the creator.
- Implementation checklist (2026-10-05, branch `redesign/4-plan` on `redesign/3-briefs`, PR against #10):
  - [x] Config: `freeTestPeriod` from `FREE_TEST_PERIOD` (`true`/`false`, unset → true, anything else throws), spec. Compose (dev + prod), `.env.prod.example`, docs/ENVIRONMENT_VARIABLES.md.
  - [x] Plan: `profiles.plan` enum (free/pro, default free) + `proExpiresAt` timestamptz, both `@Exclude` (not in public profiles). Pure `effectivePlan(profile, now)` + spec (pro without expiry or not yet expired → pro; anything else → free; the test period does not change it). `PlanService.forUser(userId)` reads the row each call (no cache, so an admin change applies at once). `GET /plan/me` (brand): `{ plan, storedPlan, proExpiresAt, freeTestPeriod, priceKzt: 19900, checkoutPriceKzt }` (0 in the test, else null). `POST /plan/checkout` (brand, test period only): Pro + `proExpiresAt = now + 30 days` under a profile row lock, `plan.checkout` audit row (`{ priceKzt: 0, proExpiresAt }`) in the same transaction; already Pro → 409 `PLAN_ALREADY_PRO`; off → 409 `PLAN_CHECKOUT_UNAVAILABLE`.
  - [x] Storage: `StorageService` abstract (`put(key, buffer)`, `read(key)` stream, `remove(key)`), `LocalDiskStorage` under `UPLOAD_DIR` (keys are generated uuids, checked by regex; no user file names). `files` table (id, `ownerId` → users ON DELETE CASCADE, `kind` portfolio/verification, `mimeType`, `size`, `storageKey`, `position`, `createdAt`). Image upload pipe: Multer memory storage, 5 MB, one file; type from magic bytes (jpeg/png/webp) + spec; 413 → `PAYLOAD_TOO_LARGE`, wrong type → 415 `UPLOAD_UNSUPPORTED_TYPE`, missing → 400 `UPLOAD_MISSING`. `GET /files/:id` with optional auth: portfolio public (`Cross-Origin-Resource-Policy: cross-origin`, long cache); other kinds owner or admin, else 401 (no token) / 404; `nosniff`, `private, no-store`. TransformInterceptor passes `StreamableFile` through. Docker volume `uploads` (dev + prod; prod image creates the dir for the `nestjs` user). nginx: `client_max_body_size 6M` on the two upload routes only.
  - [x] Portfolio: `POST /files/portfolio` (creator, max 6, counted under a profile row lock → 409 `PORTFOLIO_FULL`), `DELETE /files/portfolio/:id` (owner), `GET /files/portfolio/me`. Applicant view gets `portfolio: string[]` (file ids, position order, one query for all applicants).
  - [x] Verification: `creator_verifications` (one row per creator profile: followers int, engagementRate numeric(5,2) percent, `screenshotId` → files, status pending/approved/rejected, `rejectReason`, `submittedAt`, `reviewedAt`, `reviewedById`). `profiles.verifiedAt` = the badge. `GET /verification/me`; `POST /verification` multipart (followers, engagementRate, screenshot) → pending, badge cleared, previous screenshot removed. Changing followers/ER through `PATCH /profiles/me` on a verified profile clears the badge.
  - [x] Admin: `GET /admin/verifications?status=` (paginated, oldest first, with creator name/email and current stats), `POST /admin/verifications/:id/approve` (body `submittedAt` → compare-and-set, 409 `VERIFICATION_STALE`; sets `verifiedAt`, copies the stats into the profile), `POST /admin/verifications/:id/reject` (`reason` 3–500 chars). `GET /admin/brands` (paginated, search by name/email, stored + effective plan), `PATCH /admin/brands/:profileId/plan` (`plan`, `proExpiresAt` future or null). `audit_log` table (actor, action, target type/id, details jsonb, createdAt) written in the same transaction as each admin action; `GET /admin/audit` (paginated).
  - [x] Paywall: `GET /order-applications/order/:id?verifiedOnly=true` — effective Free → 403 `PLAN_PRO_REQUIRED`; Pro → only `verifiedAt` creators. Spec: Free brand gets 403 and no repository query; Pro filters; in the test period a stored-Free brand gets 403 until it checks out.
  - [x] Migration `PlanUploadsVerification` generated on a scratch DB at `BriefModel`; round trip; no drift. New error codes in RU/KZ/EN (`PAYLOAD_TOO_LARGE`, `UPLOAD_UNSUPPORTED_TYPE`, `UPLOAD_MISSING`, `PORTFOLIO_FULL`, `FILE_NOT_FOUND`, `VERIFICATION_NOT_FOUND`, `VERIFICATION_STALE`, `PLAN_PRO_REQUIRED`).
  - [x] Frontend: `services/files.ts` (public URL helper, authed blob fetch for private images), `services/verification.ts`, `services/plan.ts`, `services/admin.ts`; `plan`, `verification`, `admin` namespaces RU/KZ/EN.
  - [x] Creator page `/influencer/stats` ("Stats and portfolio"): verification status (none / pending / verified / rejected with the reason), claim form (followers, ER, screenshot, field errors), portfolio grid (upload up to 6, remove). Linked from the Profile page and the account menu.
  - [x] Brand Plan page `/brand/plan` (nav item): Free vs Pro, ₸19 900/month; test period → "free during the test period", no payment step; off → Kaspi transfer instructions; current plan and expiry.
  - [x] Applicants: content strip shows portfolio images (placeholders when none); "Verified only" toggle works for effective Pro, Free sees an upgrade prompt linking to Plan.
  - [x] Admin shell `/admin/*` (admin home was the creator feed, which redirected in a loop): Verification queue (claim beside the screenshot, Approve / Reject with reason), Brands (set plan + expiry).
  - [x] Checks (both apps), migration round trip, `docker compose up -d --build --no-deps backend frontend`, `qa-r4.mjs` (both `FREE_TEST_PERIOD` values), cleanup (`qa_left` 0, Mailpit empty), security-review, one review agent, push, CI, PR.
- As built (`redesign/4-plan`, PR on #10, commits `937570f`..`893fecc`): `FREE_TEST_PERIOD` (unset → true, anything but `true`/`false` stops startup) opens the 0 ₸ Pro checkout (`893fecc`: `POST /plan/checkout` stores Pro for 30 days with a `plan.checkout` audit row; off → Kaspi + admin); the effective plan is computed on each read from `profiles.plan` + `proExpiresAt` (no cron, no cache). `StorageService` with a local private disk under `UPLOAD_DIR` (volume `uploads_data`), generated keys; type from magic bytes, EXIF/XMP/IPTC/comments and PNG/WebP text chunks stripped without decoding. `GET /files/:id`: portfolio public, screenshots owner/admin only (anonymous 401, others 404), `nosniff` + sandboxed CSP. `creator_verifications` (one claim per creator) with an admin queue (approve is compare-and-set on `submittedAt`, copies the stats into the profile and sets `verifiedAt`); every admin action writes `audit_log` in the same transaction. `?verifiedOnly=true` checks the plan before any query. Frontend: Plan page, Stats and portfolio page, admin shell (queue, brands), working "Verified only" and an upgrade prompt; `CSP_IMG_SRC` in the frontend image. The `PlanUploadsVerification` migration is additive.
- Checks (at `893fecc`): backend `tsc` ok · eslint 0 · prettier ok · Jest `28 passed` / `216 passed` · `nest build` ok. Frontend `tsc` ok · eslint 0 errors / 1 warning · Vitest `7 passed` / `28 passed` · `vite build` ok; first-load JS 779 834 → 807 292 bytes (the three new namespaces' locales; 805 987 at `8ce25fc`). The checkout needs no migration: `migration:generate --dr` on a scratch DB at `PlanUploadsVerification` reports no changes. Migration generated on a scratch DB at `BriefModel`: up → `--dr` no drift → down (tables, columns, enums gone) → up → no drift.
- Browser QA (Docker, headless Chrome, `qa-r4.mjs` restarts the backend to switch the flag) 119/119 at `893fecc` (94/94 at `8ce25fc`, before the checkout): upload rules (SVG as `.png` 415, 6 MB 413, no file 400, brand/anonymous refused, EXIF GPS stripped, 7th image 409); serving matrix (portfolio public with CORP and immutable cache; screenshot anonymous 401 / brand 404 / other creator 404 / owner and admin 200 `no-store`); creator uploads PNG/JPEG/WebP and sends a claim in the UI; admin rejects with a reason in the UI and the creator sees it; resubmit replaces the screenshot; stale approve 409; approve locks the stats; audit log; a profile edit clears the badge; test period on: a stored-Free brand is effectively Free (API verified-only 403, the toggle opens the upgrade prompt), the Plan page shows "0 ₸" for Free and Pro with the 19 900 ₸ note and no Kaspi steps, "Get Pro for 0 ₸" in the UI → toast and "Pro до …", the same token then gets only the verified creator, `audit_log` has `plan.checkout` with `priceKzt` 0, a second checkout → 409 `PLAN_ALREADY_PRO`, creator 403 / anonymous 401 on checkout; then the content strip shows portfolio images and "Verified only" filters; off (brand reset to Free in SQL): checkout → 409 `PLAN_CHECKOUT_UNAVAILABLE`, Free → 403 `PLAN_PRO_REQUIRED` (still the full list), upgrade prompt → Kaspi steps with the account email and no checkout button, admin sets Pro in the UI and the same token is allowed at once, expired Pro is Free on the next request; flag back to `true`. KZ/RU/EN, light/dark, 1280/390 without horizontal scroll, raw keys or console errors, including `/brand/plan` in both states; no other user's email in responses. Found during QA: the test-period alert repeated "Test period" (badge + note), note shortened. The script now polls `/health` after a restart and logs in once (the old poll reused a 15-minute token and the dev container's `npm ci` took minutes). `qa-r4-*` users, files on disk, claims, audit rows and Mailpit removed, 0 left.
- Security review: done inline against the PR base (the `security-review` skill diffs against `origin/HEAD`, which shares no history with this stack). Fixed: public portfolio JPEGs kept phone GPS in EXIF (`8ce25fc`). Checked: generated keys (no traversal), `nosniff` + sandboxed CSP on files, 404 for non-owners of private files, refresh tokens cannot fetch files, `verifiedAt`/plan fields in no DTO, paywall checked server-side before the query, class-level `@Roles(ADMIN)`, ILIKE wildcards escaped, upload throttle and Multer limits; checkout (`893fecc`): brand-only, no client-supplied price or date, flag read on the server, profile row locked so a double click cannot write two audit rows. Accepted: the Verified badge stays visible to Free brands (Pro sells the filter).
- Review (one reviewer agent): approve with comments, no high-severity items. Fixed in `8ce25fc`: (4) a metrics patch without a rate compared `NaN !== NaN` and cleared the badge, and replaced `metrics` wholesale — skips unset fields and merges; (5) the upgrade prompt also reacts to a refused shortlist query; (3) the `jsonb_set` approve SQL checked on Postgres with null and existing `metrics`; (7) the `/files/:id` matrix is covered in `files.service.spec`.
- Known, not fixed here: (1) account deletion would leave stored bytes on disk — today `DELETE /users/:id` cannot delete a user with a profile (FK `NO ACTION`), so nothing orphans; whoever builds account deletion must remove the keys; (2) a crash between the disk write and the commit leaves an unreferenced file — a sweep script with D2 storage; (6) the badge is not cached elsewhere on the frontend, nothing to invalidate; a 5 MB image can decode to a very large bitmap in the viewer's browser (decompression bomb; no server-side decoding).

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
- [x] D3: free test version, nobody is charged; price kept as designed; Pro through a 0 ₸ checkout during the test (revised 2026-10-05, see D3 above).
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
