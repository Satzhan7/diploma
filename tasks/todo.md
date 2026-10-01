# Productization Plan — AdPartners.kz v1 (2026-10-01)

Source: [docs/PRODUCT-BRIEF.md](../docs/PRODUCT-BRIEF.md) (from the grilling session) + project audit of 2026-10-01.
Format: ECC `blueprint`. Each step is about one PR. Dependencies are listed under "Needs". Steps marked ∥ can run in parallel with the other ∥ steps in the same phase.
Rule: every phase ends with something deployable and usable. Nothing goes to `main` without passing CI.

## Decisions still open (resolve before the phase that needs them)

- [ ] **D1 — Matches and collaborations (before Phase 2).** Today there are three overlapping concepts: Match, Order→Application, and Collaboration. Recommendation: **one Deal = an accepted Application.** Remove Match and Collaboration; keep the matching *score* as a ranking function only.
- [ ] **D2 — Hosting in Kazakhstan (before Phase 8).** Choose a KZ provider (e.g. PS Cloud, Hoster.kz, Kazakhtelecom cloud) with Postgres and S3-compatible storage, to comply with the personal-data localisation law.
- [ ] **D3 — Pro price and Free limits (before Phase 5).** Price in ₸, Pro duration, and whether Free has any brief limit.
- [ ] **D4 — Screenshot storage (before Phase 5).** S3-compatible bucket in KZ vs local disk volume.

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

## Phase 1 — Foundation
- [ ] 1.1 ∥ Upgrade the backend Docker image and CI to Node 20 LTS; fix the old `jsonwebtoken` chain so all four crashing Jest suites run.
- [ ] 1.2 ∥ Migrate the frontend from CRA to Vite (keep Chakra v2, switch Jest to Vitest). Needs: none.
- [ ] 1.3 ∥ Add a GitHub Actions CI job: typecheck, lint, and test for both apps, plus the frontend build. Needs: 1.1.
- [ ] 1.4 Add a baseline TypeORM migration that creates the whole schema; set `migrationsRun` in production; remove the `Order.brandUser` and `User.categories` leftovers first. Needs: Docker Postgres, D1 (so the baseline isn't redone).
- [ ] 1.5 ∥ i18n setup: `react-i18next`, RU (default), KZ and EN locale files, language switcher, backend error codes instead of English strings. Extract the existing strings.
- **Done when:** CI is green on `main`; a fresh Postgres plus `migration:run` boots production mode; the UI switches RU/KZ/EN.

## Phase 2 — Domain model: one Deal pipeline (Needs: D1, 1.4)
- [ ] 2.1 Design doc and ADR (ECC `architecture-decision-records`): the Brief → Application → Deal lifecycle and Mermaid state diagrams.
- [ ] 2.2 Deal state machine in one service with a transition table. Application: PENDING → ACCEPTED / REJECTED / WITHDRAWN. Deal: ACTIVE → PROOF_SUBMITTED → COMPLETED or DISPUTED, plus CANCELLED. Unit tests for every allowed and forbidden transition.
- [ ] 2.3 Remove the Match and Collaboration modules, endpoints and pages; keep `matchScore()` as a pure ranking function (with tests).
- [ ] 2.4 Admin role: `ADMIN` guard, `/admin` route shell, audit log table (who changed what).
- [ ] 2.5 Pagination (`take`/`skip`, default 20) on every list endpoint; typed query DTOs.
- **Done when:** the old Match and Collaboration code is gone; every status change goes through the state machine; the lists are paginated.

## Phase 3 — Design system 2.0, "creator-energetic" (∥ with Phase 2; Needs: 1.2)
- [ ] 3.1 Design direction study: an artifact with 2–3 palette and type options (no purple default). The team picks one. Uses ECC `frontend-design-direction`.
- [ ] 3.2 Tokens: colour (primary, accent, success/warning/danger, verified), type scale (a display font for creator surfaces, Inter for the UI), spacing, radius, shadow, motion. Written into `theme.ts` semantic tokens with light/dark; the ECC `design-system` skill generates `DESIGN.md` and a preview.
- [ ] 3.3 Core components: CreatorCard (avatar, content strip, match score, Verified), BriefCard, StatusPill (from the state machine), DealTimeline, EmptyState, PlanBadge, LanguageSwitcher.
- [ ] 3.4 Two layout modes: `creator` (spacious, visual) and `workspace` (dense, tables, sticky actions).
- [ ] 3.5 ECC `design-system audit` plus an accessibility pass (AA contrast in both themes, labels, keyboard use, RU/KZ text length).
- **Done when:** no hard-coded colours remain (lint rule); the components are documented; the audit score is recorded.

## Phase 4 — Core loop UX (Needs: 2.2, 3.3)
- [ ] 4.1 Information architecture: new navigation per role. Brand: Briefs · Applicants · Deals · Messages · Plan. Influencer: Find briefs · My applications · Deals · Messages · Profile. Admin: Verification · Brands/Plans · Moderation.
- [ ] 4.2 Brief wizard (under 3 minutes): goal, platform, budget in ₸, city, niche, deadline, deliverables; save drafts; preview.
- [ ] 4.3 Influencer brief feed: filters (city, niche, budget), one-tap apply with a pitch and price, mobile-first.
- [ ] 4.4 **Brand applicant feed** (the memorable detail): CreatorCards ranked by `matchScore`, compare view, accept/reject, shortlist.
- [ ] 4.5 Influencer onboarding: profile, niches, city, socials, self-reported stats and a screenshot upload; a progress meter.
- [ ] 4.6 Landing page in RU/KZ/EN, aimed at the brand owner, with the call to action "Post your first brief".
- **Done when:** a new brand signs up and posts a brief in under 3 minutes (timed run); an influencer applies from a phone.

## Phase 5 — Verification and paywall (Needs: 2.4, 4.5, D3, D4)
- [ ] 5.1 Screenshot upload endpoint: type and size limits, private storage, signed URLs.
- [ ] 5.2 Admin verification queue: approve or reject with a reason; approval locks the stats and sets `verifiedAt`; resubmitting clears the badge.
- [ ] 5.3 Plan model: `plan` (FREE/PRO) and `proExpiresAt` on the brand; admin screen to set the plan; a nightly job downgrades expired plans.
- [ ] 5.4 Paywall: the "Verified only" filter is enforced server-side for Pro; Free users see an upgrade prompt with Kaspi payment instructions.
- **Done when:** a Free brand cannot get verified-only results through the API; an admin upgrade takes effect immediately.

## Phase 6 — Deal completion and reputation (Needs: 2.2)
- [ ] 6.1 Influencer submits a proof link and an optional screenshot → PROOF_SUBMITTED.
- [ ] 6.2 Brand confirms (→ COMPLETED) or disputes (→ DISPUTED, goes to the admin moderation queue).
- [ ] 6.3 Two-way ratings with a comment; rating averages on profiles; one rating per deal per side.
- **Done when:** a whole deal can be run start to finish in an e2e test.

## Phase 7 — Notifications (Needs: 2.2)
- [ ] 7.1 Notification table plus an in-app bell (WebSocket push; unread count fixed per recipient).
- [ ] 7.2 Email: verification email, password reset (also an auth gap), new applicant, deal updates. Provider: Resend or SES. Templates in RU/KZ/EN.
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
P0 → P1 ─┬→ P2 ─┬→ P4 → P5
         │      ├→ P6
         │      └→ P7
         └→ P3 ─┘(3.3 → 4.x)
P8 needs P4–P7 + D2
```

## Review gate (blueprint adversarial check)
- Before starting each phase: re-read PRODUCT-BRIEF anti-goals; cut any step that serves agencies, in-app payments, or social APIs.
- After each phase: run `code-review` on the diff; `security-review` on P0, P5 and P7; record the result here.

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
