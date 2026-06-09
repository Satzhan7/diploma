# Audit Fix Implementation — 2026-06-10

Branch: audit/fixes. Source: docs/FIX_PLAN.md, docs/SECURITY_AUDIT.md, docs/REPOSITORY_CLEANUP.md.

## Phase 0 — commit pending
- [ ] Commit transform.interceptor.ts + Register.tsx
- [ ] Commit refreshed audit docs (separate commit)

## Phase 1 — critical security (nest build after each)
- [ ] 1.1 RegisterDto: @IsIn(['brand','influencer'])
- [ ] 1.2 jwt.strategy.validate → minimal claims; check GetCurrentUser/GetUser consumers
- [ ] 1.3 DELETE /users/:id ownership; remove POST /users
- [ ] 1.4 ValidationPipe whitelist+forbidNonWhitelisted+transform; drop type from UpdateProfileDto
- [ ] 1.5 WS joinChat membership check; gateway CORS from env
- [ ] 1.6 Collaborations: force brandId=caller on create; ownership on findOne/update
- [ ] 1.7 order-applications findOne ownership
- [ ] 1.8 throttler (global 100/min, auth 10/min) + helmet

## Phase 2 — stability
- [ ] 2.1 socket.ts: origin-only URL + explicit path
- [ ] 2.2 statistics Between() ×4 sites
- [ ] 2.3 ArrayContains for categories filter
- [ ] 2.4 transactions: order claim (pessimistic lock) + accept-application
- [ ] 2.5 /health endpoint + AppController re-register + e2e update + compose healthcheck
- [ ] 2.6 JWT TTLs from ConfigService; ChatsModule reuse auth JWT config
- [ ] 2.7 console.* → Logger; remove entity dumps

## Phase 3 — cleanup (build check after each batch)
- [ ] Batch 1: root src/, root package.json+lock
- [ ] Batch 2: backend brands/ influencers/ messages/ scripts/(keep dir for seed) old migrations, yarn.lock, GetUser→GetCurrentUser consolidation
- [ ] Batch 3: frontend dead files, types merge → chat.ts, yarn.lock
- [ ] Batch 4: markdown dedup

## Phase 3.7 — seed script
- [ ] backend/src/scripts/seed.ts + npm run seed

## Verification
- [ ] nest build clean
- [ ] tsc --noEmit clean
- [ ] docker-compose up -d clean start
- [ ] seed populates
- [ ] admin register → 400
- [ ] /auth/profile no hashes
- [ ] DELETE other user → 403
- [ ] category filter no 500
- [ ] stats date filters correct
- [ ] commit history clean

## Results
(fill at end)
