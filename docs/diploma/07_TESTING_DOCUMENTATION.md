# 07 — Testing Documentation

This document describes the testing strategy for AdPartners.kz and lists realistic functional test cases for every implemented function. Test cases are written so the team can execute them manually and fill the "Actual Result" column during their pre-defense test pass.

## 1. Testing strategy

| Layer | Approach | Tools |
|---|---|---|
| Functional / acceptance | Manual scripted execution against a running `docker-compose up` stack with the React frontend (`cd frontend && npm start`). | Browser, curl, Postman. |
| API | Endpoint-level testing via Swagger UI (`/docs`) and Postman collection. | Swagger UI, Postman. |
| Unit | NestJS Jest scaffolding exists but only contains boilerplate (`backend/src/app.controller.spec.ts`, `frontend/src/App.test.tsx`). Adding real unit tests is `Future improvement`. | Jest. |
| Integration | None currently. Recommended targets: `MatchingService.calculateMatchScore`, `AuthService.register/login/refreshTokens`, `OrderApplicationsService.create`. | Jest with TypeORM in-memory or test container. |
| E2E | None currently. Recommended tool: Playwright. | Playwright. |
| Performance | Not performed. Recommended baseline: 200 concurrent users on the chat endpoint with a Redis socket adapter. | k6, Artillery. |
| Security | Manual review of the JWT and `RolesGuard` flows. | Burp Suite, OWASP ZAP. |

Until automated coverage is added, the manual test cases below are the source of truth for the diploma defense. Each test case describes the precondition, the steps, and the expected result. The "Actual Result" column is left as *To be filled by tester*; the team fills it in during the pre-defense test pass.

## 2. Test environment

| Item | Value |
|---|---|
| Backend | `docker-compose up` (PostgreSQL on 5435, NestJS on 3005). |
| Frontend | `cd frontend && npm start` (CRA dev server on 3000). |
| Browser | Chrome 124+ or Firefox 128+. |
| Test users | One brand account, one influencer account, both seeded by registration. |
| Postman environment | `baseUrl = http://localhost:3005`, plus `accessToken` and `refreshToken` variables. |

## 3. Functional test cases

| Test Case ID | Function | Precondition | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-001 | Register valid brand | None | 1. Open `/register`. 2. Fill name="Aigerim K.", email="aigerim+brand@test.kz", password="secret123", role="brand". 3. Submit. | HTTP 201; tokens persisted to localStorage; redirect to `/brand/dashboard`. | To be filled by tester | Ready to run |
| TC-002 | Register valid influencer | None | Same as TC-001 with role="influencer". | HTTP 201; redirect to `/influencer/dashboard`. | To be filled by tester | Ready to run |
| TC-003 | Register with duplicate email | TC-001 executed | Submit registration with the same email "aigerim+brand@test.kz". | HTTP 409 Conflict, message "User with this email already exists". | To be filled by tester | Ready to run |
| TC-004 | Register with short password | None | Submit registration with password="123". | HTTP 400, validation error on `password`. | To be filled by tester | Ready to run |
| TC-005 | Register with invalid email | None | Submit registration with email="not-an-email". | HTTP 400, validation error on `email`. | To be filled by tester | Ready to run |
| TC-006 | Login valid credentials | TC-001 executed | Submit login with the brand's email and password. | HTTP 200; tokens returned; redirect to `/brand/dashboard`. | To be filled by tester | Ready to run |
| TC-007 | Login wrong password | TC-001 executed | Submit login with email="aigerim+brand@test.kz", password="wrong". | HTTP 401, message "Invalid credentials". | To be filled by tester | Ready to run |
| TC-008 | Login unknown email | None | Submit login with email="nobody@test.kz", any password. | HTTP 401. | To be filled by tester | Ready to run |
| TC-009 | Access protected route without token | None | Issue `GET /profiles/me` without `Authorization` header. | HTTP 401. | To be filled by tester | Ready to run |
| TC-010 | Access protected route with valid token | TC-001 executed | Issue `GET /profiles/me` with `Authorization: Bearer <accessToken>`. | HTTP 200; profile JSON for the brand. | To be filled by tester | Ready to run |
| TC-011 | Access protected route with expired token | TC-001 executed; wait > 15 minutes | Issue `GET /profiles/me`. | HTTP 401; frontend Axios interceptor clears tokens and redirects to `/login`. | To be filled by tester | Ready to run |
| TC-012 | Refresh access token | TC-001 executed | `POST /auth/refresh` with `{ refreshToken }`. | HTTP 200; new access + refresh pair. | To be filled by tester | Ready to run |
| TC-013 | Refresh with invalid token | None | `POST /auth/refresh` with `{ refreshToken: "garbage" }`. | HTTP 401. | To be filled by tester | Ready to run |
| TC-014 | Update own profile | TC-001 executed | `PATCH /profiles/me` with `{ bio: "New bio", categories: ["fashion"] }`. | HTTP 200; the same `GET /profiles/me` returns the updated bio. | To be filled by tester | Ready to run |
| TC-015 | View counterpart profile by userId | TC-001 + TC-002 executed | As the brand, `GET /profiles/<influencer userId>`. | HTTP 200; influencer's profile data. | To be filled by tester | Ready to run |
| TC-016 | Brand search influencers | TC-002 executed | As the brand, `GET /profiles/influencers/search?category=fashion`. | HTTP 200; non-empty array of influencer profiles. | To be filled by tester | Ready to run |
| TC-017 | Influencer search brands | TC-001 executed | As the influencer, `GET /profiles/brands/search`. | HTTP 200; brand profiles. | To be filled by tester | Ready to run |
| TC-018 | Wrong role to brand-only search | TC-002 executed | As the influencer, `GET /profiles/influencers/search`. | HTTP 403 Forbidden. | To be filled by tester | Ready to run |
| TC-019 | Create order (brand) | TC-001 executed | As the brand, submit `CreateOrder` form with valid fields. | HTTP 201; order appears in `GET /orders/brand` with status `open`. | To be filled by tester | Ready to run |
| TC-020 | Create order with budget < 0 | TC-001 executed | Submit `CreateOrder` with budget = -10. | HTTP 400; validation error on `budget`. | To be filled by tester | Ready to run |
| TC-021 | Create order with title < 3 chars | TC-001 executed | Submit `CreateOrder` with title = "ab". | HTTP 400; validation error on `title`. | To be filled by tester | Ready to run |
| TC-022 | List available orders (influencer) | TC-019 executed; TC-002 executed | As the influencer, `GET /orders/available`. | HTTP 200; the brand's order is included. | To be filled by tester | Ready to run |
| TC-023 | Filter available orders by budget | TC-019 executed; TC-002 executed | `GET /orders/available?minBudget=2000`. | HTTP 200; the order from TC-019 (budget 1000) is excluded. | To be filled by tester | Ready to run |
| TC-024 | Apply to an order | TC-019 + TC-002 executed | `POST /order-applications/<orderId>` with `{ message: "I would like to collaborate.", proposedPrice: 800 }`. | HTTP 201; application appears in `GET /order-applications` with status `pending`. | To be filled by tester | Ready to run |
| TC-025 | Apply with empty message | TC-002 executed | Submit application with `message = ""`. | HTTP 400; validation error on `message`. | To be filled by tester | Ready to run |
| TC-026 | Brand views applications | TC-024 executed | As the brand, `GET /order-applications/order/<orderId>`. | HTTP 200; the influencer's application is in the response. | To be filled by tester | Ready to run |
| TC-027 | Brand accepts application | TC-024 executed | `PATCH /order-applications/<id>` with `{ status: "accepted" }`. | HTTP 200; application status updates to `accepted`. | To be filled by tester | Ready to run |
| TC-028 | Brand rejects application | TC-024 executed | `PATCH /order-applications/<id>` with `{ status: "rejected" }`. | HTTP 200; application status updates to `rejected`. | To be filled by tester | Ready to run |
| TC-029 | Influencer withdraws application | TC-024 executed | `DELETE /order-applications/<id>`. | HTTP 200; application status updates to `withdrawn`. | To be filled by tester | Ready to run |
| TC-030 | Get recommended influencers | TC-001 executed | As the brand, `GET /matching/recommendations/influencers?limit=10`. | HTTP 200; array sorted by `matchScore` descending; influencers already matched with this brand are excluded. | To be filled by tester | Ready to run |
| TC-031 | Get recommended brands | TC-002 executed | As the influencer, `GET /matching/recommendations/brands?limit=10`. | HTTP 200; sorted, deduplicated. | To be filled by tester | Ready to run |
| TC-032 | Calculate match score | Both users present | `POST /matching/calculate` with `{ brandId, influencerId }`. | HTTP 200; response includes `categoryMatch`, `audienceMatch`, `engagementScore`, `totalScore` (0–100). | To be filled by tester | Ready to run |
| TC-033 | Create a match | Both users present | `POST /matching` with brand and influencer ids. | HTTP 201; match has status `pending`. | To be filled by tester | Ready to run |
| TC-034 | Accept match auto-creates chat | TC-033 executed | `POST /matching/<id>/accept`. | HTTP 200; match status `accepted`; a chat exists in `GET /chats` for both users with at least one initial message. | To be filled by tester | Ready to run |
| TC-035 | Reject match | TC-033 executed | `POST /matching/<id>/reject`. | HTTP 200; match status `rejected`. | To be filled by tester | Ready to run |
| TC-036 | Complete a match (brand) | TC-034 executed | `PATCH /matching/<id>/complete`. | HTTP 200; match status `completed`. | To be filled by tester | Ready to run |
| TC-037 | Update match stats | TC-034 executed | `PATCH /matching/<id>/stats` with `{ clicks: 5, impressions: 100, engagementRate: 0.04 }`. | HTTP 200; `match.stats` reflects the values; counters accumulate on subsequent calls. | To be filled by tester | Ready to run |
| TC-038 | Create a chat | Both users present | `POST /chats/<recipientId>` as brand. | HTTP 201; chat object returned; the same call again returns the existing chat. | To be filled by tester | Ready to run |
| TC-039 | Send a message via REST | TC-038 executed | `POST /chats/<chatId>/messages` with `{ content: "Hello" }`. | HTTP 201; message persisted. | To be filled by tester | Ready to run |
| TC-040 | Send empty message | TC-038 executed | `POST /chats/<chatId>/messages` with `{ content: "" }`. | HTTP 400 / "Message content cannot be empty". | To be filled by tester | Ready to run |
| TC-041 | Real-time delivery | Two browser sessions, both authenticated | Both load `/messages`. User A sends "Hello" to User B. | User B's screen shows the new message instantly without refresh. | To be filled by tester | Ready to run |
| TC-042 | Mark chat as read | TC-039 executed | `POST /chats/<chatId>/read` as the recipient. | HTTP 200; `unreadCount = 0` in `GET /chats`. | To be filled by tester | Ready to run |
| TC-043 | Brand statistics | TC-037 executed | `GET /statistics/brand?startDate=...&endDate=...`. | HTTP 200; KPI totals reflect the stats updates. | To be filled by tester | Ready to run |
| TC-044 | Influencer statistics | TC-037 executed | `GET /statistics/influencer?startDate=...`. | HTTP 200; KPIs visible. | To be filled by tester | Ready to run |
| TC-045 | Settings UI loads | TC-001 executed | Open `/brand/settings`. | The page renders without errors. The notification toggles are visible (backend persistence is partial). | To be filled by tester | Ready to run |
| TC-046 | Delete account | TC-001 executed | From Settings, click "Delete account" and confirm. | HTTP 200; user redirected to `/`; `users.id` row gone. | To be filled by tester | Ready to run |
| TC-047 | Logout (frontend) | TC-001 executed | Click "Logout" in the sidebar. | Tokens cleared; redirect to `/`. | To be filled by tester | Ready to run |
| TC-048 | Role gate — wrong role on `/brand/dashboard` | TC-002 executed | As an influencer, navigate to `/brand/dashboard` directly. | The router redirects to `/influencer/dashboard`. | To be filled by tester | Ready to run |
| TC-049 | Public landing redirect | TC-001 executed | Authenticated user navigates to `/`. | Router redirects to the role-specific dashboard. | To be filled by tester | Ready to run |
| TC-050 | Swagger UI loads | None | Open `http://localhost:3005/docs`. | Swagger UI renders all controllers and schemas. | To be filled by tester | Ready to run |

## 4. Authentication-specific tests

| ID | Scenario | Expected |
|---|---|---|
| TC-AUTH-001 | Tampered JWT (modified signature) is rejected. | HTTP 401. |
| TC-AUTH-002 | Token with valid signature but unknown `sub`. | HTTP 401 (the strategy can't load the user). |
| TC-AUTH-003 | Refresh with a token whose hash no longer matches `users.refreshToken`. | HTTP 401. |

## 5. Database tests (manual)

| ID | Scenario | Expected |
|---|---|---|
| TC-DB-001 | Email uniqueness | Inserting two users with the same email fails at the DB level. |
| TC-DB-002 | Auto profile creation | After registration, exactly one row is present in `profiles` with `user_id` = new user. |
| TC-DB-003 | Cascade Profile → SocialMedia | Adding social-media handles in the profile editor inserts rows in `social_media`. |
| TC-DB-004 | Match unique pair | `MatchingService.createMatch` rejects creation when a Match already exists for the same brand/influencer pair. |

## 6. Security tests

| ID | Scenario | Expected |
|---|---|---|
| TC-SEC-001 | Cross-role write attempt | An influencer issues `POST /orders` with the brand's category and gets HTTP 403. |
| TC-SEC-002 | Mass-assignment of `role` | A user attempts `PATCH /users/<id>` with `{ role: "admin" }`. Outcome: needs confirmation; the `/users` controller is currently unguarded — see also Repository Analysis Report risk row. |
| TC-SEC-003 | XSS in message content | Send a message with `<script>alert(1)</script>`. The frontend must render it as text, not execute. | To be filled by tester. |

## 7. Performance tests

Not executed in the current iteration. Suggested benchmarks for future work:

- 100 simultaneous WebSocket clients in a single chat room — message delivery latency target < 500 ms.
- 50 concurrent `GET /matching/recommendations/influencers` — p95 response time target < 1 s.

## 8. User acceptance testing

| Acceptance criterion | Status |
|---|---|
| A brand can register, complete their profile, publish an order, view applications, accept one, chat with the influencer, and update match stats. | To be filled by tester. |
| An influencer can register, complete their profile with social-media handles, browse orders, apply, see status updates, and chat with the brand. | To be filled by tester. |
| Both can view their dashboards with KPI cards. | To be filled by tester. |
| Both can delete their account. | To be filled by tester. |

## 9. Known issues

| ID | Severity | Issue | Workaround |
|---|---|---|---|
| KI-001 | Medium | Frontend does not auto-refresh expired access tokens (the user is logged out after 15 minutes of inactivity). | Manually log back in. |
| KI-002 | Low | Recommendation listing endpoints (`GET /matching/recommendations/{influencers,brands}`) currently rank by `categoryMatch` only, even though `MatchingService.calculateMatchScore` already produces a deterministic three-factor score. | Wiring the full score into the listings is a documented future improvement (FI-005). |
| KI-003 | Low | `Settings → Notifications` UI does not persist (no backend endpoints for `/users/settings`). | Document the limitation in the user guide. |
| KI-004 | Low | (Resolved) All maintenance endpoints now live under `/chats/admin/*`, are gated by `@Roles(UserRole.ADMIN)`, and are hidden from the public Swagger document. |
| KI-005 | Low | (Resolved) WebSocket fallback in `frontend/src/services/socket.ts` now points at `http://localhost:3005`, matching the API. The client still prefers `REACT_APP_API_BASE_URL` when set. |

## 10. Recommendations

| ID | Recommendation |
|---|---|
| TR-001 | Add Jest unit tests for `MatchingService.calculateMatchScore` (edge cases: empty categories, full overlap, no overlap). |
| TR-002 | Add Jest integration tests for `AuthService.register`, `login`, `refreshTokens`, `deleteAccount`. |
| TR-003 | Add Playwright E2E tests for the brand and influencer happy-path flows described in Section 8. |
| TR-004 | Add a load-testing script for the chat gateway using k6. |
| TR-005 | Run a manual security review of the unguarded `/users` controller; either lock it down with `JwtAuthGuard` and admin-only role on write operations, or document why it is intentionally open. |
| TR-006 | Establish a regression checklist (this document, Section 3) and re-run it after every database-affecting change. |
