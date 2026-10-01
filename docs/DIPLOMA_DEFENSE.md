# Diploma Defense Guide — AdPartners.kz

**Date:** 2026-06-10. Supersedes `DIPLOMA_DEFENSE_BRIEF.md`. Pair with [AUDIT.md](AUDIT.md) for the honest state of the code.

---

## 1. The 60-second pitch

> Influencer marketing in Kazakhstan runs on Instagram DMs and spreadsheets: discovery is manual, agreements are informal, there is no localized platform. AdPartners.kz is a two-sided web platform where brands publish campaign orders, influencers apply, both sides negotiate in real-time chat, and dashboards track campaign KPIs. Stack: React 18 SPA, NestJS 10 REST + WebSocket API, PostgreSQL 14, deployed with Docker Compose behind nginx with Let's Encrypt TLS.

Numbers to memorize: **9 backend domain modules · 9 DB entities · ~40 REST endpoints + Swagger · JWT access (15 min) + rotating refresh (7 days) · 3 roles**.

## 2. Recommended demo flow (dev compose, ~7 minutes)

Pre-demo (night before): `docker-compose up -d`, run the seed script (FIX_PLAN 3.7), full dry run, **record a backup screen capture**.

1. **Landing** → register a brand (show role selection). Mention: bcrypt hashing, profile auto-created server-side.
2. **Brand dashboard** → create an order (budget, category, deadline, requirements). Show a validation error briefly — examiners like seeing rejects.
3. Second browser/incognito → register/login as influencer → browse available orders → filter by category → **apply** with cover letter + proposed price.
4. Back as brand → applications list → **accept** one. Narrate the side effects: order → in-progress, match auto-created as accepted, other applications auto-rejected, chat auto-seeded with a welcome message.
5. **Chat** with both windows side by side — message arrives live (WebSocket, no refresh).
6. **Statistics dashboard** → KPIs and campaign table.
7. Close with **Swagger** at `:3005/docs` — "the API is fully documented; here's the contract."

Fallbacks: Docker misbehaves → backup recording; WebSocket blocked on venue Wi-Fi → send via REST and say exactly that ("persistence is intact, only liveness is lost").

## 3. Questions examiners will ask — with answers

**Architecture & DB**

- *Why NestJS?* Opinionated module/DI structure mirrors layered architecture from coursework; first-class TypeScript; guards/pipes/interceptors for cross-cutting concerns; built-in Swagger and WebSocket support.
- *Why both `users` and `profiles` tables?* Honest answer: identity/auth in `users`, marketing data in `profiles`; admitted flaw — several attributes got duplicated during iteration, consolidation is in the refactor plan ([AUDIT.md](AUDIT.md) §5). Don't pretend it's clean — examiners read schemas.
- *Why no migrations / `synchronize: true`?* Conscious trade-off for a single-developer demo system: schema-from-entities is reproducible on a fresh DB. Production path is a generated migration baseline with `DB_SYNCHRONIZE=false` (FIX_PLAN 3.1). Say "schema versioning" out loud.
- *How does matching work?* Deterministic, explainable scoring: Jaccard overlap of category sets (40%), audience match from language/content-type overlap (30%), engagement score normalized from rate + follower bracket (30%) — `matching.service.ts:282-364`. Deliberately not ML: no training data exists yet; an explainable heuristic beats an unvalidatable model. Future work: learn the weights from accepted-match outcomes.

**Security** (be ready — the audit found real issues)

- *How is auth implemented?* Short-lived JWT access + 7-day refresh, refresh stored **bcrypt-hashed** server-side and rotated on every use; frontend does single-flight refresh with request replay (`frontend/src/services/api.ts`).
- *Where are tokens stored client-side?* localStorage. Known trade-off — XSS-readable; production hardening moves refresh into an httpOnly SameSite cookie. Saying this unprompted earns points.
- *SQL injection / XSS?* ORM parameter binding everywhere incl. raw queries; React output escaping, no `dangerouslySetInnerHTML`. CSRF n/a (header tokens, no session cookies).
- *Is it production-secure today?* "A security audit is part of my submission ([SECURITY_AUDIT.md](SECURITY_AUDIT.md)); criticals such as role restriction at registration are fixed per the plan." **Run FIX_PLAN Phase 1 before the defense so this sentence is true.**

**Quality & process**

- *Test coverage?* Weakest point — don't bluff. With FIX_PLAN 3.3 done: "unit tests for the matching algorithm and auth service plus an e2e happy path; exhaustive coverage was out of scope, I prioritized a working product plus a documented security audit." Without 3.3: it's the documented next step — show the audit instead.
- *How would it scale?* Stateless API → horizontal replicas behind nginx; planned Postgres indexes (FIX_PLAN 3.2); socket.io needs a Redis adapter for multi-instance; pagination on list endpoints. Honest current limit: one VPS, fine for hundreds of users.
- *What was hardest?* Good story: the chat data model (the repo carries two real data-repair migrations from reworking message↔chat relations) and the refresh-token race on the frontend (solved with single-flight queueing).
- *Why CRA, not Vite/Next?* CRA was the stable scaffold at project start; no SEO requirement → SSR adds nothing; Vite migration is mechanical and planned.

**Business**

- *Who pays?* Commission on completed collaborations and/or brand subscription tiers; this version targets validation, not monetization.
- *Competitors?* Upfluence/AspireIQ are enterprise-priced and not localized; the local market runs on agencies and DMs — the gap is an affordable self-serve local tool.

## 4. Weak spots — disarm proactively

| Weakness | One-line defense |
|---|---|
| 0% test coverage (pre-3.3) | "Prioritized shipping + a documented security/fix audit; matching-algorithm units are first, here's the plan" |
| `synchronize` in prod | "Deliberate demo bootstrap, flagged with the migration path in my own audit" |
| users/profiles duplication | "Known debt from iteration, documented with a consolidation plan" |
| Dead modules / stray files | Execute [REPOSITORY_CLEANUP.md](REPOSITORY_CLEANUP.md) **before** submitting — cheapest credibility win available |
| Matching is a heuristic | "Explainable by design; ML needs outcome data the platform doesn't have yet" |
| Single developer, AI-assisted | If asked: AI used as a tool; you must explain every flow you demo — re-read `auth.service.ts`, `order-applications.service.ts:98-213`, `matching.service.ts` the night before |

## 5. Strengths to steer toward

Refresh-token rotation done properly (hashed, rotated, single-flight client) · real-time chat with auto-seeding on acceptance · clean domain-module decomposition · full Swagger · prod deployment with TLS + certbot renewal · self-audit documents (AUDIT/SECURITY/FIX_PLAN) — presenting your own critical audit is a differentiator examiners rarely see.

## 6. Pre-defense checklist

- [ ] FIX_PLAN Phase 0 + Phase 1 (1.1–1.4 minimum) merged
- [ ] Seed script committed; demo data loads in one command
- [ ] Two dry runs of §2 on a clean `docker-compose up`
- [ ] Backup recording stored on the laptop (not the cloud)
- [ ] Repository cleanup executed
- [ ] Architecture + ERD diagrams exported for slides
- [ ] §3 answers rehearsed out loud once
