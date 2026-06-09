# Security Audit — AdPartners.kz

**Date:** 2026-06-10 · **Method:** manual code review of every controller/service/guard/gateway, DTO validation paths, Docker/nginx configs, dependency scan. Dynamic testing **Not Verified** (no running instance during audit).

Severity model: **Critical** = remote compromise of other users' data/accounts with trivial effort · **High** = serious confidentiality/integrity impact, needs auth or specific conditions · **Medium** = real weakness, limited blast radius · **Low** = hardening gap.

---

## Critical

### C1 — Privilege escalation: self-registration as ADMIN
`POST /auth/register` accepts `role` validated only as `@IsEnum(UserRole)` — and `UserRole` includes `ADMIN` (`backend/src/auth/dto/register.dto.ts:19-21`, `users/entities/user.entity.ts:17-21`). Anyone obtains admin and unlocks every `@Roles(ADMIN)` route: chat maintenance endpoints with raw-SQL access (`chats.controller.ts:42-206`), all-collaborations listing and delete (`collaborations.controller.ts:25-30,60-65`).
**OWASP:** A01 Broken Access Control. **Fix:** restrict to `brand | influencer` (`@IsIn(['brand','influencer'])`).

### C2 — Any authenticated user can delete any user
`DELETE /users/:id` has no ownership or role check (`users.controller.ts:61-64`) → account destruction of arbitrary users. `PATCH /users/:id` *does* check ownership (`:44-59`) — the DELETE gap is an oversight.
**OWASP:** A01. **Fix:** require `id === currentUserId` or ADMIN, mirroring PATCH.

### C3 — Credential-hash disclosure via `/auth/profile`
`JwtStrategy.validate` returns `{ ...user, sub }` (`auth/strategies/jwt.strategy.ts:19-26`). The spread drops the `User` class prototype, so `TransformInterceptor`'s `instanceToPlain` (`common/interceptors/transform.interceptor.ts:19`) cannot apply `@Exclude` — `GET /auth/profile` (`auth.controller.ts:34-41`) returns the bcrypt **password hash** and **refreshToken hash** to the client (offline-cracking target).
**OWASP:** A02 / A01. **Fix:** return a minimal claim object from `validate()` (`{ id, sub, email, role, name }`), or `plainToInstance(User, …)` to preserve metadata.

### C4 — Arbitrary user creation via `POST /users`
Any authenticated user can create users with any role, bypassing registration (`users.controller.ts:16-19`); no profile is created (broken accounts) and it is a second admin-minting path.
**OWASP:** A01. **Fix:** delete the endpoint or restrict to ADMIN.

---

## High

### H1 — WebSocket chat room hijack
`joinChat` joins any `chat:<id>` room with no participant check (`chats/chats.gateway.ts:82-89`); all new messages in that chat are then pushed to the attacker live (`emitNewMessage`, `:101-123`). Chat IDs circulate in API responses; UUID secrecy is not authorization. Gateway CORS is `origin: '*'` (`:17-22`).
**OWASP:** A01. **Fix:** in `handleJoinChat`, load the chat and verify `socketUserMap.get(client.id)` is sender or recipient; scope CORS to `CORS_ORIGIN`.

### H2 — Collaborations IDOR (create/update/read)
Any brand can create a collaboration naming **any** `brandId`/`influencerId` (`collaborations.controller.ts:18-23` — IDs are caller-supplied, never compared to `req.user.id`), `PATCH` any collaboration (`:53-58`), and `GET /collaborations/:id` returns anyone's record (`:46-51`).
**OWASP:** A01. **Fix:** force `brandId = req.user.id` on create; ownership checks in update/findOne.

### H3 — Order-application IDOR (read)
`GET /order-applications/:id` returns any application — including competitors' `proposedPrice` and cover letter (`orders/order-applications.controller.ts:63-72`; no ownership check in `order-applications.service.ts:85-96`).
**OWASP:** A01. **Fix:** allow only the applicant or the owning brand.

### H4 — Mass assignment via permissive ValidationPipe + Object.assign
`new ValidationPipe()` without `whitelist`/`forbidNonWhitelisted`/`transform` (`main.ts:18`). Unknown props survive into `Object.assign(profile, profileData)` (`profiles.service.ts:55-58`) and `Object.assign(application, dto)` (`order-applications.service.ts:132`). Additionally `UpdateProfileDto.type` is explicitly allowed (`profiles/dto/update-profile.dto.ts`) → users can flip their profile brand↔influencer, corrupting role-gated flows.
**OWASP:** A08 / A04. **Fix:** `new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`; drop `type` from the DTO.

### H5 — No rate limiting / brute-force protection
No `@nestjs/throttler`, no helmet, no lockout (zero matches in `backend/src` and package.json). `POST /auth/login` and `/auth/register` are unbounded.
**OWASP:** A07. **Fix:** ThrottlerModule global guard (tight limits on auth routes) + `helmet()` in `main.ts`.

### H6 — Permissive CORS fallback with credentials
When `CORS_ORIGIN` is unset, `origin: true` reflects **any** Origin while `credentials: true` (`main.ts:12-15`). Prod compose sets it, but env drift silently reopens cross-origin access.
**OWASP:** A05. **Fix:** fail closed — in production refuse to boot without `CORS_ORIGIN`.

---

## Medium

| # | Finding | Location | Note |
|---|---|---|---|
| M1 | Order-claim race — two influencers can both win an open order (read-check-write, no transaction/lock) | `orders.service.ts:67-85` | Integrity |
| M2 | Accept-application flow not transactional (order+match+chat+reject-others); partial failure leaves mixed state | `order-applications.service.ts:135-210` | Integrity |
| M3 | Weak default secrets in dev compose (`JWT_SECRET=your-secret-key-change-in-production`, `postgres/postgres`) and dead fallback `'super-secret'` | `docker-compose.yml:37-39`, `config/configuration.ts:15` | Copy-paste-to-prod risk |
| M4 | `POST /matching/calculate` computes scores for arbitrary user pairs (enumeration/info leak) | `matching.controller.ts:79-87` | |
| M5 | `GET /users` returns the full user list (all roles, emails) to any authenticated user; no pagination | `users.controller.ts:21-24` | Exposure + load |
| M6 | Swagger UI exposed unauthenticated in production at `/docs` | `main.ts:24-32` | API map for attackers |
| M7 | `TransformInterceptor` catch-block returns **raw** data on serialization error — `@Exclude` silently skipped | `transform.interceptor.ts:20-24` | Fail-open serializer |

---

## Low

| # | Finding | Location |
|---|---|---|
| L1 | JWT tokens in `localStorage` (XSS-readable); no CSP served | `frontend/src/services/api.ts:15`, `frontend/nginx.conf` |
| L2 | Access/refresh tokens share secret & claims, no `typ` claim; cross-use blocked only by the stored-hash bcrypt compare | `auth.service.ts:60-113` |
| L3 | No security headers (helmet missing; nginx lacks `X-Frame-Options`, `X-Content-Type-Options`, CSP) | `frontend/nginx.conf`, `nginx/site.conf` |
| L4 | `messages/` module: full CRUD with **zero guards** — currently dead (not imported in AppModule), becomes Critical if ever wired in | `messages/messages.controller.ts` |
| L5 | Verbose logs print user/application entities (PII) to stdout | e.g. `order-applications.service.ts:31,67,70` |

---

## Not found / N-A

- **SQL injection:** none — TypeORM parameter binding throughout; raw SQL uses `$1` placeholders (`chats.service.ts:60-69,173-176`; admin routes in `chats.controller.ts`).
- **XSS:** React auto-escaping; no `dangerouslySetInnerHTML` (grep-verified).
- **CSRF:** Authorization-header token model, no session cookies → classic CSRF N/A.
- **SSRF / file upload / path traversal:** features don't exist in this codebase.
- **Committed secrets:** none — dev placeholders and `CHANGE_ME` examples only.

## Remediation order

C1 → C3 → C2/C4 → H4 (one-line pipe change) → H1 → H5/H6 → H2/H3 → M1–M7. Concrete diffs and effort estimates: [FIX_PLAN.md](FIX_PLAN.md) Phase 1.
