# Fix Plan — Prioritized Roadmap

**Date:** 2026-06-10. Supersedes the 2026-06-09 plan (its C1/C2/C3 env+compose fixes shipped in commit `6664b8e` and are removed here). IDs reference [AUDIT.md](AUDIT.md) and [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

Legend: **P** priority (P0 worst) · **Impact** what breaks if skipped · **Cx** complexity (S/M/L) · **Est** effort.

---

## Phase 0 — Commit what's already fixed (5 min)

Two uncommitted working-tree fixes from the previous session are part of the security story — commit them first:
- `backend/src/common/interceptors/transform.interceptor.ts` (proper `instanceToPlain` serialization)
- `frontend/src/pages/Register.tsx` (surface backend 409 message)

```bash
git add backend/src/common/interceptors/transform.interceptor.ts frontend/src/pages/Register.tsx
git commit -m "fix: class-transformer serialization + register error surface"
```

---

## Phase 1 — Critical security fixes (≈1 day)

| # | Task | P | Impact | Cx | Est | Files |
|---|---|---|---|---|---|---|
| 1.1 | Block ADMIN self-registration: `@IsIn(['brand','influencer'])` on `RegisterDto.role` | P0 | Anyone becomes admin | S | 15 min | `auth/dto/register.dto.ts` |
| 1.2 | Stop hash leak: return `{ id: user.id, sub, email: user.email, role: user.role, name: user.name }` from `JwtStrategy.validate` | P0 | Password/refresh hashes served to clients | S | 30 min | `auth/strategies/jwt.strategy.ts` (verify `GetUser`/`GetCurrentUser` consumers still get `id`/`sub`/`role`) |
| 1.3 | Ownership on `DELETE /users/:id` (self or ADMIN); delete or ADMIN-gate `POST /users` | P0 | Anyone deletes/mints accounts | S | 30 min | `users/users.controller.ts` |
| 1.4 | Harden ValidationPipe: `new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`; remove `type` from `UpdateProfileDto` | P0 | Mass assignment, profile-type flips | S | 30 min + smoke-test forms | `main.ts`, `profiles/dto/update-profile.dto.ts` |
| 1.5 | WS `joinChat` membership check (load chat, compare userId from `socketUserMap`); CORS from env | P1 | Live chat eavesdropping | M | 1–2 h | `chats/chats.gateway.ts` |
| 1.6 | Collaborations ownership: force `brandId = req.user.id` on create; participant checks on findOne/update | P1 | IDOR | S | 1 h | `collaborations/collaborations.controller.ts`, `.service.ts` |
| 1.7 | Application-read ownership: applicant or order-owning brand only | P1 | Competitor bids visible | S | 30 min | `orders/order-applications.service.ts:85` |
| 1.8 | Add `@nestjs/throttler` (global, strict on `/auth/*`) + `helmet` | P1 | Brute force | S | 1 h | `app.module.ts`, `main.ts`, `backend/package.json` |

## Phase 2 — Stability / functional bugs (≈1–2 days)

| # | Task | P | Impact | Cx | Est | Files |
|---|---|---|---|---|---|---|
| 2.1 | Fix prod socket namespace: connect to origin with explicit `path`, keep namespace `/chats` (parse `baseURL` → `io(origin + '/chats', { path: '/socket.io' })`) | P1 | Realtime chat dead in prod | S | 1 h | `frontend/src/services/socket.ts` |
| 2.2 | Statistics date range: use `Between(from, to)` when both bounds set (4 sites) | P1 | Wrong dashboard numbers | S | 30 min | `statistics/statistics.service.ts:53-58,86-87,140-141,162-163` |
| 2.3 | Fix `ILike` on `categories text[]`: use `:cat = ANY(categories)` or `&&` array overlap | P1 | 500 on influencer category filter | S | 30 min | `users/users.service.ts:29` |
| 2.4 | Wrap order-claim and application-accept in transactions (`dataSource.transaction`), pessimistic lock on order row | P2 | Double-assignment race | M | 3–4 h | `orders/orders.service.ts`, `order-applications.service.ts` |
| 2.5 | Fix e2e: register `AppController` as `/health` (health JSON) or delete controller+spec; add compose healthcheck on it | P2 | Failing suite; no healthcheck | S | 1 h | `app.module.ts`, `app.controller.ts`, `test/app.e2e-spec.ts`, compose files |
| 2.6 | Single JWT config: TTLs from `ConfigService` in auth module/service; remove ChatsModule's own `JwtModule.registerAsync` (import AuthModule's) | P2 | Three competing TTL sources | S | 1 h | `auth/auth.module.ts`, `auth/auth.service.ts`, `chats/chats.module.ts` |
| 2.7 | Replace 50 `console.*` with Nest `Logger`; drop entity dumps | P2 | PII in logs, noise | S | 1–2 h | grep `console.` in `backend/src` |
| 2.8 | `deleteAccount`: throw `InternalServerErrorException` instead of bare `Error` | P3 | Raw 500 | S | 10 min | `auth/auth.service.ts:139` |
| 2.9 | Remove broken `User.orders` inverse and unused `Order.brandUser` | P3 | Confusing model | S | 30 min | `users/entities/user.entity.ts:69-71`, `orders/entities/order.entity.ts:87-88` |

## Phase 3 — Production readiness (≈2–3 days, optional before defense)

| # | Task | P | Impact | Cx | Est |
|---|---|---|---|---|---|
| 3.1 | Real migrations: TypeORM datasource + generated baseline; `DB_SYNCHRONIZE=false` in prod | P2 | Schema drift risk | M | 0.5 d |
| 3.2 | Indexes: `orders(status)`, `orders(brand_id)`, `message("chatId")`, `match(brandId,influencerId)` + unique, `order_application(orderId,applicantId)` + unique | P2 | Scale + closes race window | S | 2 h |
| 3.3 | Tests: units for `calculateMatchScore`/`calculateCategoryMatch` + AuthService; one e2e happy path (register→login→order→apply→accept) | P1 (defense) | "0% coverage" criticism | M | 1 d |
| 3.4 | Backend Dockerfile: `npm ci --omit=dev`, stop copying node_modules from dev stage; add `frontend/.dockerignore` (`node_modules`, `build`) | P3 | Image bloat | S | 1 h |
| 3.5 | DEPLOY.md: add certbot bootstrap (`certbot certonly --standalone` before first nginx start) | P2 | Fresh deploy fails | S | 30 min |
| 3.6 | nginx security headers (`X-Frame-Options`, `X-Content-Type-Options`, basic CSP); pagination on list endpoints | P3 | Hardening | M | 0.5 d |
| 3.7 | Commit a seed script (`backend/src/scripts/seed.ts` + npm script): 2 brands, 4 influencers, orders, applications, one chat | P1 (demo) | Empty demo screens | S | 2 h |

## Phase 4 — Repository & documentation cleanup (≈0.5 day)

Execute [REPOSITORY_CLEANUP.md](REPOSITORY_CLEANUP.md): delete dead backend modules (`brands/`, `influencers/`, `messages/`), stray root `src/` + root `package.json`/lock, yarn locks, ~17 dead frontend files, `backend/src/scripts/` repair files; merge/remove superseded docs (`DOCUMENTATION_AUDIT.md`, `DIPLOMA_DEFENSE_BRIEF.md`, `REVIEW_FIXES_AND_REFLECTION.md`, `docs/diploma/11_*`); fill `frontend/README.md`; add `docs/ARCHITECTURE.md` from AUDIT §1 diagrams. **Verify builds after each deletion batch** (`nest build`, `tsc --noEmit`).

## Phase 5 — Diploma defense preparation (≈1 day)

| # | Task | Est |
|---|---|---|
| 5.1 | Run the demo script in [DIPLOMA_DEFENSE.md](DIPLOMA_DEFENSE.md) end-to-end twice on a clean `docker-compose up` | 2 h |
| 5.2 | Drill the examiner question list (same doc), esp. tests/migrations/matching algorithm | 2 h |
| 5.3 | Record a backup screen-capture of the happy path in case live demo fails | 1 h |
| 5.4 | Export architecture + ERD diagrams (AUDIT §1, `docs/diploma/05_DATABASE_DOCUMENTATION.md`) | 1 h |

---

## Minimum to defend safely

Phase 0 + Phase 1 items 1.1–1.4 + 3.7 (seed data) + 5.1–5.3; add 2.1 only if demoing the prod deployment. Roughly **one working day**.
