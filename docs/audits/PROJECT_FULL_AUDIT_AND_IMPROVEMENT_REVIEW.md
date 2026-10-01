# AdPartners.kz — Full Audit and Improvement Review

**Audit date:** 2026-07-14  
**Scope:** Current working tree of this repository (read-only audit).  
**Method:** Static code/configuration/documentation review plus non-mutating TypeScript and test commands. No application code, configuration, data, dependencies, or deployment state was changed. This report is the sole requested artifact.

## 1. Executive summary

| Dimension | Score | Basis |
|---|---:|---|
| Overall quality | **57/100** | Solid breadth and recent hardening work, but key flows and verification are incomplete. |
| Production readiness | **30/100** | A critical token-boundary flaw, default production schema synchronization, no CI, and no proven deployment. |
| Diploma readiness | **58/100** | The product is demonstrable after targeted repairs, but claims in defense documentation are materially stale. |
| Security | **48/100** | JWT/RBAC/validation foundations are good; refresh-token confusion is a critical authentication defect. |
| Code quality | **62/100** | TypeScript, modular Nest structure, and shared UI primitives; several large components, `any`, duplicated/legacy surfaces. |
| Architecture | **55/100** | Clear frontend/backend split, but user-versus-profile identifiers and schema management are inconsistent. |
| UX/UI | **63/100** | Good role shell and reusable UI work; three prominent actions are broken or placeholders. |
| Testing/reliability | **18/100** | No useful automated regression suite currently executes end-to-end. |

**Verdict:** **Conditionally ready for a local diploma demonstration only after P0/P1 repairs and a documentation revalidation. Not ready for public production deployment.**

### Five most important problems

1. **P0 — refresh tokens authenticate protected REST and WebSocket requests.** Access and refresh JWTs use the same signing key and no token type/audience is enforced ([backend/src/auth/auth.service.ts:104-131](backend/src/auth/auth.service.ts#L104-L131), [jwt.strategy.ts:13-16](backend/src/auth/strategies/jwt.strategy.ts#L13-L16)). A stolen seven-day refresh token is therefore usable as a seven-day access token.
2. **P1 — database changes can be made implicitly in production.** `DB_SYNCHRONIZE` defaults to `true`, while the repository has no runnable versioned migration baseline ([docker-compose.prod.yml:26-38](docker-compose.prod.yml#L26-L38), [backend/src/config/configuration.ts:9-12](backend/src/config/configuration.ts#L9-L12)).
3. **P1 — core UI flows fail or do nothing.** “Express Interest” submits an invalid body, “View Profile” routes to a missing URL, and “Mark completed” only shows an alert ([BrandRecommendations.tsx:48-56](frontend/src/pages/influencer/BrandRecommendations.tsx#L48-L56), [BrandRecommendations.tsx:196-204](frontend/src/pages/influencer/BrandRecommendations.tsx#L196-L204), [MatchDetail.tsx:169-174](frontend/src/pages/MatchDetail.tsx#L169-L174)).
4. **P1 — regression verification is absent.** Backend unit test command discovers zero tests; frontend Jest cannot initialize because its installed Chakra package is incomplete/mismatched, and its sole assertion checks removed CRA text ([frontend/src/App.test.tsx:5-9](frontend/src/App.test.tsx#L5-L9), [backend/test/app.e2e-spec.ts:6-29](backend/test/app.e2e-spec.ts#L6-L29)).
5. **P1 — diploma documentation contradicts current source and references deleted files.** For example, README says refresh rotation is absent while the client implements it ([README.md:152](README.md#L152), [frontend/src/services/api.ts:26-120](frontend/src/services/api.ts#L26-L120)).

### Five strongest parts

- Authentication is protected by JWT guards and sensitive role checks; user self-update strips role/password fields ([users.controller.ts:51-69](backend/src/users/users.controller.ts#L51-L69)).
- Global validation rejects unknown fields and Helmet is enabled ([main.ts:11-31](backend/src/main.ts#L11-L31)).
- Passwords and stored refresh tokens are bcrypt-hashed; the JWT strategy returns a minimal claims object rather than serializing the entity ([jwt.strategy.ts:19-30](backend/src/auth/strategies/jwt.strategy.ts#L19-L30)).
- Frontend token refresh uses a considered single-flight replay queue ([api.ts:26-120](frontend/src/services/api.ts#L26-L120)).
- The role-based application shell, shared status/empty/skeleton/page-header components, responsive navigation, and candid limitations documentation create a credible base for a diploma demo.

## 2. Audit limitations and verification evidence

The audit reflects the **current, already-dirty working tree**; it does not attribute existing changes to this review. No live database, deployed host, browser visual run, migration, package install, or destructive lint command was run.

| Check | Result | Meaning |
|---|---|---|
| `frontend npm exec -- tsc --noEmit` | Passed | Frontend TypeScript type check passed. |
| `backend npm exec tsc -- --noEmit` | Passed | Backend TypeScript type check passed. |
| Frontend Jest | Failed before tests | Cannot resolve `@chakra-ui/utils/context`; installed `@chakra-ui/utils` lacks its `dist` files. This proves the local test environment is unusable, not that a clean `npm ci` will fail identically. |
| Backend `npm test -- --runInBand` | Failed / zero discovered | No unit specs exist under the configured Jest root. |
| Backend E2E | Failed without DB | Test initializes the real `AppModule`, retries a missing PostgreSQL connection, times out, then calls `close` on undefined. It does not isolate dependencies. |
| Compose config validation | Parsed | Both compose files parse; development compose emits only obsolete `version` warning. Production interpolation warns when required environment values are absent, as expected in this audit environment. |
| Offline lockfile audit | 0 known prod vulnerabilities | Useful but **not** a current online vulnerability assurance. |

## 3. Project structure and architecture

The repository is sensibly split into `frontend/` React and `backend/` NestJS applications, with Docker/NGINX at root and a substantial diploma documentation set under `docs/`. Nest feature modules make controller/service/entity responsibilities generally understandable.

| ID | Priority | Location | Problem and impact | Recommended direction |
|---|---|---|---|---|
| ARC-01 | P1 | [orders entity](backend/src/orders/entities/order.entity.ts#L63-L88), [users entity](backend/src/users/entities/user.entity.ts#L69-L71) | `Order.brand` is a `Profile`, `brandUser` is a `User`, and inverse typing points through `order.brand`. This mixed identity model is already causing an influencer-listing failure. | Select canonical `User` ownership plus optional profile joins; migrate and update all service contracts together. |
| ARC-02 | P1 | [profiles service](backend/src/profiles/profiles.service.ts#L89-L144) | Search implementation assumes PostgreSQL arrays over `simple-array`/varchar fields and queries non-persisted `productCategories`. | Define a typed filter DTO; use true `text[]` with migrations or compatible expressions; remove/add the field coherently. |
| ARC-03 | P2 | [messages page](frontend/src/pages/Messages.tsx), [matching service](backend/src/matching/matching.service.ts) | Large components/services (492/418 lines) mix rendering/transport and lifecycle/business rules, increasing regression cost. | Extract focused hooks and domain helpers after P1 behavior tests exist. |
| ARC-04 | P2 | [services/brands.ts](frontend/src/services/brands.ts), [services/influencers.ts](frontend/src/services/influencers.ts), [services/collaborations.ts](frontend/src/services/collaborations.ts) | Some unused client services target nonexistent controllers/routes. | Delete proven-unused surfaces or align them with documented endpoints; add contract tests. |

There are no circular imports confirmed by this audit. The separate module boundaries are a strength, but shared user/profile identity must be normalized before scaling.

## 4. Functional feature inventory and end-to-end trace

| Feature | Status | Evidence | Risk | Required action |
|---|---|---|---|---|
| Registration/login/profile | Mostly implemented | `Register`/`Login` → `/auth/*` → `AuthService` → `User`/`Profile` | Refresh token type flaw; no auth-flow tests | P0 token separation and auth integration tests. |
| Token refresh | Implemented, unsafe boundary | Client single-flight queue; backend refresh endpoint | Refresh token can be used as access token | Enforce `typ`/audience/key separation. |
| Brand order creation/listing | Implemented | `CreateOrder` → `POST /orders` → `OrdersService` | No edit/cancel flow; no integration tests | Document limitation; test create/list. |
| Influencer discover/apply | Partially broken | `POST /order-applications/:orderId` is canonical; legacy `POST /orders/:id/apply` exists | Claimed order may not appear in influencer list due profile/user ID mismatch | Normalize identifiers and retire/align duplicate API. |
| Applications approval | Partially reliable | Service transaction and lock on status transition | Duplicate submissions and submit-vs-accept races remain | DB uniqueness + transactional insert/recheck. |
| Matching/recommendations | Partially broken | recommendation endpoints exist and brand recommendations render | Express Interest 400; profile link 404; ranking is limited | Repair payload/link; test role flow. |
| Match stats/completion | Partially broken | stats endpoint/service and completion endpoint/service exist | Completion button no-op; stats unvalidated | Wire mutation; introduce validation DTO. |
| Real-time chat | Partially reliable | REST persistence + Socket.IO namespace and membership check | Incorrect bidirectional unread count; reconnect timeout survives unmount | Per-user read state, bounded messages, cancellation test. |
| Collaboration management | Unsafe partial feature | RBAC controller and CRUD service exist | Brand can create/reassign arbitrary participant/order relationships | Narrow DTO and relationship validation. |
| Dashboards/statistics | Partial | `StatisticsService` aggregates orders/applications/matches | Daily analytics are illustrative; data quality follows match stats | Validate stats and label limitations in demo. |
| Settings/account deletion | Implemented with UX gap | client-local settings and authenticated deletion | Native confirmation is not accessible; preferences not server-side | Accessible dialog; document local-only scope. |

## 5. Confirmed bugs and reliability defects

| ID | Severity / confidence | Exact location | Reproduction and root cause | Expected vs actual | Recommended fix / regression test |
|---|---|---|---|---|---|
| BUG-01 | Critical / confirmed | [auth.service.ts:104-131](backend/src/auth/auth.service.ts#L104-L131), [jwt.strategy.ts:13-16](backend/src/auth/strategies/jwt.strategy.ts#L13-L16), [chats.gateway.ts:52-54](backend/src/chats/chats.gateway.ts#L52-L54) | Send a valid refresh token as Bearer token or Socket.IO handshake token. Same signer/key and no token type verification. | Refresh only; it authenticates protected REST/WS paths. | Separate key or typed/audience JWTs and reject refresh tokens in JWT/WS strategies. Test REST + WS 401/connection rejection. |
| BUG-02 | High / confirmed | [orders.service.ts:80-107](backend/src/orders/orders.service.ts#L80-L107), [orders.controller.ts:61-66](backend/src/orders/orders.controller.ts#L61-L66), [orders.service.ts:128-133](backend/src/orders/orders.service.ts#L128-L133) | Apply through legacy order endpoint, then list influencer orders. Profile ID is saved but User ID queried. | Applied order should list; it is omitted. | Standardize on user IDs or resolve profile consistently; API test apply → list. |
| BUG-03 | High / confirmed | [profiles.service.ts:99-116](backend/src/profiles/profiles.service.ts#L99-L116), [profiles.service.ts:140-142](backend/src/profiles/profiles.service.ts#L140-L142), [profile.entity.ts:76-80](backend/src/profiles/entities/profile.entity.ts#L76-L80) | Submit language/content/product filters. PostgreSQL array operator is used on `simple-array`; a queried property has no entity column. | Filter works; invalid SQL or ineffective/nonexistent filtering. | Correct data type/query and add PostgreSQL integration tests per filter. |
| BUG-04 | High / confirmed | [BrandRecommendations.tsx:48-56](frontend/src/pages/influencer/BrandRecommendations.tsx#L48-L56), [create-match.dto.ts:5-14](backend/src/matching/dto/create-match.dto.ts#L5-L14) | Influencer presses Express Interest. Body lacks required `influencerId`. | Creates interest/match; request receives 400. | Build payload from authenticated user; component/API payload test. |
| BUG-05 | High / confirmed | [BrandRecommendations.tsx:196-204](frontend/src/pages/influencer/BrandRecommendations.tsx#L196-L204), [App.tsx:132-160](frontend/src/App.tsx#L132-L160) | Click View Profile from recommendation. | Open brand profile; `/brands/:id` reaches NotFound. | Link `/influencer/profile/:userId`; router interaction test. |
| BUG-06 | High / confirmed | [MatchDetail.tsx:169-174](frontend/src/pages/MatchDetail.tsx#L169-L174), [matching.ts:107-109](frontend/src/services/matching.ts#L107-L109) | Brand presses Mark completed. | `PATCH` and refreshed status; alert-only placeholder. | Role-gated mutation, cache invalidation, happy/error tests. |
| BUG-07 | High / confirmed | [order-applications.service.ts:43-76](backend/src/orders/order-applications.service.ts#L43-L76), [order-application.entity.ts:43-47](backend/src/orders/entities/order-application.entity.ts#L43-L47) | Send identical application POSTs concurrently. Check-then-insert has no DB uniqueness. | One application; duplicates possible. | Unique `(order, applicant)` constraint, 409 translation, concurrency test. |
| BUG-08 | Medium / confirmed | [matching.controller.ts:112-120](backend/src/matching/matching.controller.ts#L112-L120), [matching.service.ts:201-217](backend/src/matching/matching.service.ts#L201-L217) | Send negative/string stats. Interface has no runtime validators. | Numeric valid analytics; strings can concatenate and negatives are accepted. | Decorated numeric range DTO; malformed-payload tests. |
| BUG-09 | Medium / confirmed | [chats.service.ts:127-182](backend/src/chats/chats.service.ts#L127-L182) | A creates chat with B; B sends; A marks read. Shared counter resets only for original recipient. | Correct per-user unread state; stale unread count. | Per-user message/read model; two-direction tests. |
| BUG-10 | Medium / confirmed | [Messages.tsx:72-99](frontend/src/pages/Messages.tsx#L72-L99), [Messages.tsx:202-215](frontend/src/pages/Messages.tsx#L202-L215) | Disconnect then navigate away before 5 seconds; or send while request fails. Timeout survives cleanup; draft clears pre-success. | No post-unmount reconnect and draft preserved on failure; reconnect occurs/draft lost. | Store and clear timeout/cancel flag; clear draft after success; fake-timer/error tests. |
| BUG-11 | Medium / confirmed | [App.tsx:108-158](frontend/src/App.tsx#L108-L158) | Visit authenticated `/brand/typo`. Inner routes have no wildcard. | Useful 404; blank layout content. | Nested wildcard route + router test. |

## 6. Security audit (OWASP-oriented)

| ID | Vulnerability | Location | Severity | Attack scenario / impact | Mitigation |
|---|---|---|---|---|---|
| SEC-01 | Refresh-token confusion | See BUG-01 | Critical | A leaked long-lived refresh token becomes an access token for REST and chat. | Token type/audience/key separation; strict validation. |
| SEC-02 | Collaboration mass assignment / relationship integrity | [update-collaboration.dto.ts:1-4](backend/src/collaborations/dto/update-collaboration.dto.ts#L1-L4), [collaborations.service.ts:59-65](backend/src/collaborations/collaborations.service.ts#L59-L65) | High | A brand creates a collaboration involving arbitrary users or reassigns IDs/order. | Server-owned identities, role/order checks, narrow update DTO. |
| SEC-03 | Credentialed permissive CORS fallback | [main.ts:14-19](backend/src/main.ts#L14-L19) | Medium | Production missing `CORS_ORIGIN` reflects arbitrary origins with credentials. | Validate env at boot and fail closed in production. |
| SEC-04 | Public Swagger in production | [main.ts:34-43](backend/src/main.ts#L34-L43) | Medium | API surface is exposed to unauthenticated internet visitors. | Disable, IP-restrict, or protect docs in production. |
| SEC-05 | Unbounded chat text / broad proxy body limit | [nginx/site.conf:24](nginx/site.conf#L24), [message.entity.ts:10](backend/src/chats/entities/message.entity.ts#L10) | Medium | Authenticated user can submit oversized message content, causing DB/memory abuse. | DTO length limit, body limit tailored to actual uploads, rate limits per sensitive action. |
| SEC-06 | Production container hardening gap | [backend/Dockerfile:22-27](backend/Dockerfile#L22-L27) | Medium | Root runtime and copied development dependencies enlarge attack surface. | Non-root user; reproducible production-only install. |
| SEC-07 | Schema mutation during production deployment | See DEP-01 | High | Entity changes can silently alter production data/schema without review/rollback. | Versioned migrations, false sync default, backup/restore rehearsal. |

**Security strengths:** bcrypt hashing, minimal JWT user claims, role guards on sensitive controllers, ownership checks in users/matches/chat rooms, whitelist/forbid validation, Helmet, bound query parameters, and transaction/locking on acceptance flow.

**Public-deployment judgment:** **No.** Correct SEC-01 and SEC-02 first; then remove production auto-sync, fail closed on required environment, harden documentation endpoint and container, and run a real integration/security suite.

## 7. API, backend, database, and data integrity

### API observations

- Controllers generally use appropriate Nest guards and `@Roles`; however, API design includes overlapping application routes (`POST /orders/:id/apply` and `POST /order-applications/:orderId`), increasing drift risk.
- List endpoints have no demonstrated pagination contract. Recommendation `limit` and searches are not enough for production-sized directories.
- Error behavior is framework-default rather than a documented uniform error envelope.
- State-changing APIs lack an idempotency strategy; the duplicate-application race is concrete evidence.

### Database integrity observations

| Issue | Why it can fail | Protection required |
|---|---|---|
| No migration baseline and production auto-sync | Deploys are not reviewable/reversible and can cause schema drift. | TypeORM datasource + versioned baseline/forward migrations; `DB_SYNCHRONIZE=false`. |
| No unique order/application pair | Concurrent requests create duplicate business records. | Composite unique index and 409 mapping. |
| User/profile ID mixing | Foreign-key semantics differ across services, yielding missing records. | Canonical user ownership model and data migration. |
| `simple-array` used as queryable set | PostgreSQL operators do not match storage representation. | `text[]` plus GIN indexes or normalized join tables. |
| Chat unread is one shared integer | Cannot correctly represent two participants’ independent read state. | Per-message recipient state or per-user chat cursor. |
| Stats fields accept arbitrary values | Dashboards can be polluted and arithmetic type-corrupted. | Validated DTO and explicit aggregate definitions. |

No backup/restore proof exists. `DEPLOY.md` gives a `pg_dump` cron example, but a schedule is not a tested recovery process.

## 8. Frontend, UI/UX, accessibility, and performance

### UI/UX and accessibility

- Responsive navigation, shared `PageHeader`, `StatusBadge`, empty states and skeletons are positive reusable foundations.
- Dark mode is incomplete: hard-coded gray colors remain in pages such as [OrderDetail.tsx:86](frontend/src/pages/influencer/OrderDetail.tsx#L86) and [MyApplications.tsx:185-214](frontend/src/pages/influencer/MyApplications.tsx#L185-L214). Browser/contrast verification is still required.
- Account deletion uses a native `window.confirm` ([Settings.tsx:81-102](frontend/src/pages/Settings.tsx#L81-L102)); replace with an accessible, focus-managed dialog.
- The UI must not present the three broken P1 actions as implemented until their APIs are wired and tested.

### Performance

No production bundle measurement, Lighthouse run, or database latency measurement was available. Static review identifies no confirmed infinite render loop. Priority performance work should follow correctness: paginate directory/list endpoints, bound message payloads, inspect dashboard queries for large datasets, add Web Vitals/RUM only if a production deployment is planned, and measure the optimized build before choosing lazy-loading boundaries.

## 9. Code quality and maintainability

| Finding | Impact | Recommendation | Priority / effort |
|---|---|---|---|
| Backend compiler strict safeguards disabled (`strictNullChecks`, `noImplicitAny`, casing/fallthrough) | Null/type boundary bugs reach runtime. | Gradually enable flags module-by-module after tests. | P2 / M |
| `any` crosses DTO/controller/service/UI boundaries | Reduces validation and refactoring confidence. | Replace external payloads with decorated DTOs and typed client models. | P2 / M |
| `npm run lint` includes `--fix` | A purported verification command edits source. | Add a non-mutating `lint:check`; reserve fix for explicit action. | P2 / S |
| Formatting whitespace in current frontend diff | Avoidable review noise. | Run formatter only in an authorized implementation change. | P3 / S |

## 10. Testing and reliability plan

### Minimum suite before diploma defense

| Priority | Test scenario | Type | Expected result |
|---|---|---|---|
| P0 | Refresh JWT sent to REST and Socket.IO | Integration/security | Rejected; only access JWT authenticates. |
| P0 | Clean-install frontend test/build | CI build | `npm ci`, Jest, TypeScript, and optimized build all pass. |
| P1 | Brand + influencer happy path | E2E with disposable PostgreSQL | register → profile → order → apply → accept → chat → stats → complete succeeds. |
| P1 | Authorization matrix | API integration | Non-owner/non-role requests return 403; participant checks hold. |
| P1 | Duplicate application and accept race | PostgreSQL integration | Exactly one application; no application after close/accept. |
| P1 | Recommendation interest/profile/completion | Component/router/API tests | Valid payload, correct route, status mutation and feedback. |
| P1 | Search filters | PostgreSQL integration | Every documented filter returns valid results/no SQL error. |
| P2 | Chat unread in both directions/reconnect cleanup | Integration + fake timers | Correct counts, no post-unmount reconnect, draft retained on failed send. |
| P2 | Migration upgrade and restore | Deployment rehearsal | Forward migration and rollback/backup restoration proven. |

### Before production

Add a CI pipeline running clean installs, non-mutating lint, type checks, unit/integration tests against ephemeral PostgreSQL, frontend production build, dependency scan, migration validation, and container image checks. The current E2E spec should inject a test database configuration and guard `app.close()` when setup fails.

## 11. Dependencies, configuration, and deployment

| ID | Evidence | Assessment / action |
|---|---|---|
| DEP-01 | [.env.prod.example:7-9](.env.prod.example#L7-L9), [docker-compose.prod.yml:26-38](docker-compose.prod.yml#L26-L38) | P1: production schema sync defaults to true. Create migrations and default false. |
| DEP-02 | [backend/Dockerfile:8](backend/Dockerfile#L8), [backend/Dockerfile:22-27](backend/Dockerfile#L22-L27), [docker-compose.yml:53](docker-compose.yml#L53) | P1: `npm install` is non-deterministic and production receives development `node_modules`. Use `npm ci` and a minimal non-root runtime. |
| DEP-03 | `package.json` manifests; no tracked CI/engine files | P1/P2: no CI and no declared supported Node version. Add engines/.nvmrc and CI. |
| DEP-04 | [nginx/site.conf:45-49](nginx/site.conf#L45-L49), [frontend/nginx.conf:7-17](frontend/nginx.conf#L7-L17) | P1: static HTML lacks a documented CSP/HSTS/frame/referrer policy; Nest Helmet only protects API responses. Define and test NGINX headers. |

The manifests/lockfiles are present and compose syntax parses. Do not blindly upgrade dependencies: first establish reproducible clean installs and a passing test baseline, then evaluate upgrades with compatibility tests.

## 12. Documentation and diploma readiness

The documentation set is unusually comprehensive and honestly describes several limitations. However, its credibility is currently reduced by stale assertions:

- [README.md:152](README.md#L152) says refresh-token rotation is absent, contradicted by [frontend/src/services/api.ts:26-120](frontend/src/services/api.ts#L26-L120).
- [README.md:157-159](README.md#L157-L159) says there is no production hosting and names legacy modules/report that are absent, despite [DEPLOY.md](DEPLOY.md) and production compose.
- [docs/diploma/00_PROJECT_CONTEXT.md:85-91](docs/diploma/00_PROJECT_CONTEXT.md#L85-L91) and [docs/diploma/10_FINAL_PROJECT_CHECKLIST.md:18](docs/diploma/10_FINAL_PROJECT_CHECKLIST.md#L18) reference removed modules and missing `11_REPOSITORY_ANALYSIS_REPORT.md`.
- [docs/diploma/07_TESTING_DOCUMENTATION.md:11](docs/diploma/07_TESTING_DOCUMENTATION.md#L11) claims a backend boilerplate spec that is absent; manual test plans have no recorded results.
- [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) contains claims superseded by current JWT/socket code.

### Defense guidance

Explain the product as a **role-based local influencer marketplace MVP** with a deterministic, explainable category-based matching approach—not a trained AI system. Demonstrate the brand/influencer happy path only after the P1 flow defects are fixed. State that production migration, notifications, file uploads, full analytics, and an admin UI are future work. Do not claim test automation, a deployed production service, or a completed feature where the source has a placeholder.

Likely committee questions and source-grounded answers:

| Question | Accurate answer |
|---|---|
| “Is the recommendation AI?” | It is currently a deterministic category/audience/engagement scoring approach; explainability was prioritized over an unvalidated ML claim. |
| “How do you secure authentication?” | JWT, bcrypt, guards and RBAC are present; before public deployment refresh tokens must be cryptographically/semantically separated from access tokens. |
| “How is schema evolution handled?” | For the demo it is entity synchronization; the production improvement is a reviewed migration baseline with synchronization disabled. |
| “What testing proves it works?” | Type checks pass, but current automated tests are inadequate; present recorded manual/E2E results only after completing the proposed disposable-DB suite. |

## 13. Future upgrade opportunities

| Phase | Objective / user value | Technical changes | Risk / complexity |
|---|---|---|---|
| 1 — Critical fixes | Prevent account misuse and visibly broken workflows | SEC-01, collaboration restrictions, core UI wiring, DB uniqueness, identifier normalization | High value / M |
| 2 — Diploma polish | Reliable, defensible live demonstration | Clean test environment, role happy-path E2E, docs reconciliation, accessible confirmations, nested 404 | High value / M |
| 3 — Production hardening | Safe operation for real users | migrations, CI, CORS/env fail-closed, NGINX headers, non-root images, backups/observability/rate limits | High value / L |
| 4 — Product evolution | Better discovery, scale and business value | actual analytics pipeline, notifications, upload/media, pagination/search indexing, explainable ranking experiments, admin tooling | Product-dependent / L |

## 14. Prioritized action plan

### Must fix immediately

| Priority | Task | Reason | Files likely affected | Complexity | Dependency |
|---|---|---|---|---|---|
| P0 | Separate/mark access and refresh JWTs and enforce in HTTP/WS | Prevent long-lived refresh token from authorizing requests | `auth.service`, JWT strategy, gateway, tests | M | None |
| P1 | Prevent collaboration participant/order reassignment | Fix authorization and data-integrity exposure | collaboration DTO/service/controller/tests | M | P0 not required |
| P1 | Disable production auto-sync and introduce migration baseline | Prevent unreviewed schema mutation | config, compose, datasource/migrations, deployment docs | L | backup rehearsal |
| P1 | Repair recommendation/match-completion UI flows | Demo-critical functionality currently fails/no-ops | `BrandRecommendations`, `MatchDetail`, `App`, tests | S | API contracts |

### Before diploma defense

| Priority | Task | Reason | Files likely affected | Complexity | Dependency |
|---|---|---|---|---|---|
| P1 | Normalize order user/profile IDs and repair order list | Applied orders are missing | order entity/services/controllers/migration/tests | M | migration plan |
| P1 | Add application uniqueness/race protection | Prevent duplicate/invalid campaign state | entity/migration/service/tests | M | migrations |
| P1 | Restore a clean reproducible test/build gate | Current evidence cannot establish behavior | package lock/deps/tests/CI | M | Node version decision |
| P1 | Reconcile all README/diploma/test claims to final commit | Avoid defense contradictions | README, `docs/`, recorded test results | M | finalized implementation |
| P2 | Correct profile filter storage/query and stats validation | Avoid SQL errors and invalid analytics | profile entity/service, stats DTO/service/tests | M | migrations |

### Before production / later

Implement per-user chat read state, pagination, non-mutating lint/strictness improvements, NGINX security headers, public-Swagger decision, non-root/minimal images, recovery rehearsals, observability, and product enhancements from Phase 4.

## 15. Final verdict and concise checklist

**Overall:** AdPartners.kz is a credible, well-scoped academic MVP with real role-based workflows and thoughtful recent hardening. It is not yet safe or verified enough to represent as a production platform.

- **Diploma defense:** conditionally ready after the P0/P1 demo flow, tests, and documentation fixes.
- **Production:** not ready.
- **Biggest risks:** refresh-token privilege duration, collaboration integrity, uncontrolled production schemas, broken user-visible actions, and unsupported documentation claims.
- **Fastest credible path:** fix the token boundary; wire the three UI actions; correct ID/filter/race defects; build one disposable-PostgreSQL brand/influencer E2E path; then regenerate claims/screenshots from that exact commit.

Final actions:

1. Close SEC-01 with REST and WebSocket regression tests.
2. Close all P1 functional defects in this report.
3. Create/test migrations and set production auto-sync false.
4. Make clean install, build, lint-check, and tests reproducible in CI.
5. Update each defense document only after verifying it against the final source and recorded test results.

