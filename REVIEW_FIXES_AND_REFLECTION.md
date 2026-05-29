# Review Fixes & Reflection — AdPartners.kz

_Date: 2026-05-29_

## 1. Honest status: what was implemented before today

**Nothing.** The earlier turns were a read-only review plus one scope question.
No source file was changed until this commit. This document records the first
code change made as a result of the review.

## 2. What was changed now

Exactly **one** fix was implemented — the highest-priority *implementable code*
fix from the review and the safest high-value one:

### Fix: frontend refresh-token rotation (review item #4)

- **File changed:** `frontend/src/services/api.ts` (only this file).
- **Problem:** The backend exposes `POST /auth/refresh` and issues a 7-day
  refresh token, but the frontend never called it. The Axios response
  interceptor treated every `401` as "logged out" — cleared tokens and
  redirected to `/login`. Result: the 15-minute access-token expiry force-logged
  users out mid-session. The documented refresh capability was unreachable.
- **Fix:** On a `401` (for non-auth calls, not already retried), the interceptor
  now calls `POST /auth/refresh` with the stored refresh token, stores the new
  tokens, and **replays the original request once**. Concurrent 401s share a
  single in-flight refresh via a queue, then replay together. If refresh fails
  or no refresh token exists, it falls back to the **previous behaviour**
  (clear tokens, redirect to `/login`).

## 3. Why this is the safe choice

- **One file, additive.** No backend change; `/auth/refresh` already worked.
- **No new libraries.** Uses the existing `axios` dependency.
- **Architecture preserved.** Still React + Axios on the client, NestJS + JWT on
  the server. No structural change.
- **Fail-safe fallback.** Any refresh failure degrades to the exact prior
  behaviour, so worst case equals today's behaviour — never worse.
- **No recursion risk.** The refresh request uses a bare `axios.post` so it
  bypasses the request interceptor and cannot loop on its own 401.

## 4. Fixes deliberately NOT done (and why)

Honoring the constraints "no broad refactor, no unrelated cleanup, no new
libraries":

| Review item | Why skipped |
|---|---|
| #1 Reconcile thesis PDF with code | Documentation task; **no editable LaTeX/PDF source exists in this repo** (only the compiled PDF in Downloads). Cannot be implemented here as a code change. Still the #1 action overall. |
| #2 Role story (`CAMPAIGN_MANAGER` / role JWT claim) | Direction is ambiguous (add role vs. scrub from doc) and spans code + docs. Not a safe single change. |
| #3 Delete dead code (orphan `messages/`, root `src/`, legacy `Brand`, mocks) | Explicitly excluded by the "no unrelated cleanup" constraint. |
| #5 CORS allowlist / `synchronize:true` / dashboard `NaN` | CORS + synchronize changes risk breaking the dev/demo setup without environment context; the dashboard `NaN` needs separate investigation. Out of scope for a "safest single fix". |

## 5. Assumptions made

- **`/auth/refresh` contract:** accepts JSON `{ refreshToken }` in the body and
  returns `{ accessToken, refreshToken }` un-enveloped. Verified against
  `backend/src/auth/auth.controller.ts:49` and `auth.service.ts:60-85`, and
  consistent with how the existing login handler reads `response.data.accessToken`.
- **Token storage stays in `localStorage`** (unchanged). Moving to HttpOnly
  cookies — as the thesis PDF claims — would be a larger, backend-touching change
  and was intentionally left out of this safe fix.
- **Single-tab refresh is sufficient** for the demo. Cross-tab refresh
  coordination (e.g. `BroadcastChannel`) was not added.

## 6. Verification

- Build/type-check result is recorded in the session output alongside this file.
- If `frontend/node_modules` is not installed, the build was skipped and noted
  honestly rather than claimed.

## 7. Reflection (рефлексия)

- The review's top finding was **not** a code bug but a **documentation–code gap**:
  the submitted PDF describes features that do not exist in the repo (MinIO,
  `CampaignsModule`, `CAMPAIGN_MANAGER`, Vite, refresh-cookie rotation). The
  repo's own `README.md` is already accurate — the highest-value remaining work
  is making the thesis match the README, not changing code.
- The safest *code* win was small and high-impact: the refresh endpoint already
  existed and just needed to be wired up on the client. Low risk, real UX bug
  removed (no more 15-minute logouts), and it brings the running app one step
  closer to what the documentation claims.
- Discipline held: scope was kept to one file, no cleanup creep, no new
  dependencies, and the change is fail-safe by construction.
- **Next recommended step:** reconcile the thesis PDF/markdown with the code
  (review item #1) before submission — that is where the defense risk lives.
