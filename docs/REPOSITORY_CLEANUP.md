# Repository Cleanup — Keep / Refactor / Delete

**Date:** 2026-06-10. Every disposition below is verified against actual references (grep of imports, `app.module.ts` wiring, route table). Supersedes `docs/DOCUMENTATION_AUDIT.md` (markdown-only inventory).
**Nothing has been deleted by this audit** — this is the execution list for FIX_PLAN Phase 4. Run `nest build` + `tsc --noEmit` after each batch.

---

## DELETE — dead code (zero references)

### Backend
| Path | Why |
|---|---|
| `backend/src/brands/` (entire dir: controller, service, module, dto×2, entity) | `BrandsModule` never imported in `app.module.ts`; `Brand` entity not in TypeORM entity list |
| `backend/src/influencers/` (entire dir) | Same; `influencers.controller.ts` and `influencers.service.ts` are 1-byte empty files |
| `backend/src/messages/` (entire dir) | `MessagesModule` never imported; duplicate `Message` entity; controller has **no guards** — a security landmine if ever wired in |
| `backend/src/app.controller.ts`, `app.service.ts`, `app.controller.spec.ts` | Not registered in AppModule; Hello-World boilerplate. **Alternative (preferred):** convert to `/health` endpoint instead of deleting (FIX_PLAN 2.5) |
| `backend/src/scripts/` (6 files: `add-recipient-to-messages.ts`, `add-recipient.sql`, `create-missing-profiles.ts`, `direct-fix.sql`, `fix-database.ts`, `fix-message-chatids.sql` + 2 READMEs) | One-off 2024 chat-schema repair scripts; superseded by migrations + admin endpoints. Keep the dir only if FIX_PLAN 3.7 puts `seed.ts` there |
| `backend/src/migrations/1724111111111-FixChatMessages.ts`, `1745086101543-AddChatIdToMessages.ts` | Data-repair scripts, never executed by any config; will conflict with a real migration baseline (FIX_PLAN 3.1) |
| `backend/yarn.lock` | npm is the package manager (Dockerfile uses `npm install`); dual lockfiles drift |
| `backend/src/auth/decorators/get-user.decorator.ts` **or** `get-current-user.decorator.ts` | Two decorators for one job; keep `GetCurrentUser` (more used), migrate `chats.controller.ts` off `GetUser` |

### Repo root
| Path | Why |
|---|---|
| `src/matching/matching.service.ts`, `src/orders/orders.module.ts` (+ `src/` dir itself) | Stray AI-edit artifacts with literal `// ... existing code ...` placeholders; import paths (`src/auth/enums/role.enum`) that exist nowhere |
| `package.json`, `package-lock.json` (repo root) | Accidental npm init; sole dep `react-icons` already in `frontend/package.json` |

### Frontend (all verified zero-import)
| Path | Why |
|---|---|
| `src/pages/Home.tsx` | Never routed (`App.tsx` routes Landing instead) |
| `src/pages/NotFound.tsx` | Route renders inline `<div>404` — either wire it (better) or delete |
| `src/pages/brand/Campaigns.tsx`, `brand/Influencers.tsx`, `brand/InfluencerRecommendations.tsx`, `brand/MatchRecommendations.tsx` | Never routed; superseded by `InfluencerList`/`Matches` |
| `src/components/auth/PublicRoute.tsx` | Route gating done inline in `App.tsx` |
| `src/components/Header.tsx`, `components/SearchIcon.tsx` | Unreferenced |
| `src/components/statistics/StatsCard.tsx`, `statistics/StatCard.tsx` | Unreferenced (dashboards use Chakra `Stat` directly) |
| `src/services/mockData.ts`, `src/services/match.ts` | Unreferenced; `matching.ts` is the live service |
| `src/mocks/` (`index.ts`, `messages.ts`, `users.ts`) | Unreferenced mock layer |
| `frontend/yarn.lock` | Dual-lockfile problem |
| `src/logo.svg`, `src/App.css` | CRA leftovers (check imports in `App.tsx`/`index.tsx` first — if `App.css` is still imported, fold into `index.css`) |

### Markdown
| Path | Why |
|---|---|
| `REVIEW_FIXES_AND_REFLECTION.md` | Historical AI-review working note |
| `docs/DOCUMENTATION_AUDIT.md` | Superseded by this file |
| `docs/DIPLOMA_DEFENSE_BRIEF.md` | Superseded by [DIPLOMA_DEFENSE.md](DIPLOMA_DEFENSE.md) |
| `docs/diploma/11_REPOSITORY_ANALYSIS_REPORT.md` | Duplicates [AUDIT.md](AUDIT.md) with stale findings |
| `backend/src/scripts/README.md`, `README-fix-chats.md` | Go with the scripts dir |

---

## REFACTOR — keep, but fix

| Path | Action |
|---|---|
| `frontend/src/types/message.ts` + `types/messages.ts` | Merge into one `types/chat.ts`; update the two importers |
| `backend/src/chats/chats.controller.ts` | Move the 4 admin maintenance endpoints (raw SQL, `service['privateField']` access) out of the public controller — or delete them outright now that the data is fixed |
| `backend/src/users/entities/user.entity.ts` | Long-term: strip influencer/brand columns duplicated in `profiles` (post-defense; needs data migration) |
| `frontend/src/pages/**` (live pages) | Standardize data fetching on React Query (currently mixed with raw `useEffect`+axios) |
| `backend/Dockerfile`; `frontend/` missing `.dockerignore` | FIX_PLAN 3.4 |
| `DEPLOY.md` | Add certbot bootstrap step (FIX_PLAN 3.5) |
| `frontend/README.md` | Empty — fill with run/build/env instructions or delete |
| `.claude/settings.local.json` | Local tool config — gitignore unless intentionally shared |

---

## KEEP — as is

- All wired backend modules: `auth/`, `users/`, `profiles/`, `orders/`, `matching/`, `chats/`, `collaborations/`, `statistics/`, `categories/`, `common/`, `config/`.
- All routed frontend pages/components (~30 files reachable from `App.tsx`), live `services/`, `contexts/`, `theme.ts`, merged `types/`.
- `docker-compose.yml`, `docker-compose.prod.yml`, `nginx/site.conf`, `frontend/nginx.conf`, `.env.prod.example`, both Dockerfiles (with refactor tweaks).
- `README.md`, `DEPLOY.md`, `docs/AUDIT.md`, `docs/FIX_PLAN.md`, `docs/SECURITY_AUDIT.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/DIPLOMA_DEFENSE.md`, this file.
- `docs/diploma/00–10` — thesis working set; keep at least through the defense, then archive (branch or `docs/archive/`).
- `frontend/public/**` images (used by Landing), `manifest.json`, `robots.txt`.

---

## Untracked local junk (not in git — delete locally)

`.DS_Store` (root, backend, frontend, docs, src), `.idea/`, `frontend/.env` (only `HTTPS=false`). `.gitignore` already covers them.

## Suggested execution order

1. Root strays + root package.json/lock (zero risk) → build check.
2. Backend dead dirs (`brands/`, `influencers/`, `messages/`, `scripts/`, old migrations) → `nest build`.
3. Frontend dead files + yarn locks → `tsc --noEmit` + `npm run build`.
4. Markdown dedup.
5. One commit per batch: `chore: remove dead <area> code (audit Phase 4)`.
