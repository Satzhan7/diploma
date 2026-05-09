# 02 — Product Requirements Document (PRD)

**Product:** AdPartners.kz
**Owner:** Innovators (Kadir Satzhan, Abenov Aslan)
**Last revision:** Spring 2025

This document specifies the functional and non-functional requirements of AdPartners.kz at the level of the first defended release. Every requirement is anchored to source code and is marked *Implemented*, *Partially implemented*, or *Future improvement*.

## 1. Product overview

AdPartners.kz is a web platform that connects local brands with mid-tier and micro-influencers in Kazakhstan and the wider Commonwealth of Independent States (CIS) market. The platform structures discovery, negotiation, collaboration, and analytics into a single product so that influencer marketing in the region can become more efficient, transparent, and measurable.

## 2. Product vision

> Become the default professional layer between Kazakh and CIS brands and influencers — a place where collaborations are discovered, negotiated, executed, and measured in one workflow.

## 3. Problem statement

Brands lack a localized, reliable way to discover and contract influencers; mid-tier and micro-influencers lack visibility and a professional workspace; both sides operate without standardized terms or measurable outcomes. International platforms (Upfluence, AspireIQ, Influencity, Grin, Traackr) target enterprise customers and do not localize for the Kazakh / Russian market. AdPartners.kz fills this gap.

## 4. Business goals

| ID | Goal | Success indicator |
|---|---|---|
| BG-1 | Reduce the friction of influencer discovery in Kazakhstan and CIS markets. | Time-to-first-application less than 24 hours after order publication. |
| BG-2 | Provide a single workspace for brand–influencer collaboration. | More than 70 % of accepted matches converge to a chat conversation within 1 hour. |
| BG-3 | Make influencer-marketing performance measurable. | Each completed match has at least one stats update (`clicks`, `impressions`, `engagementRate`, `followerGrowth`). |
| BG-4 | Professionalize the regional ecosystem. | Active collaborations have explicit status transitions and audit timestamps. |

## 5. User goals

| Role | Top user goals |
|---|---|
| Brand | Find influencers that match category and audience; publish a campaign quickly; review applications; chat in real time; track campaign outcomes on a dashboard. |
| Influencer | Be discoverable; receive recommended campaigns; apply with one form; chat with the brand; see personal performance over time. |

## 6. User roles

The roles defined in [backend/src/users/entities/user.entity.ts:17-21](../../backend/src/users/entities/user.entity.ts#L17-L21):

| Role | Code | Status |
|---|---|---|
| Guest | (unauthenticated) | Implemented |
| Brand | `UserRole.BRAND` | Implemented |
| Influencer | `UserRole.INFLUENCER` | Implemented |
| Admin | `UserRole.ADMIN` | Future improvement (no admin UI) |

## 7. User personas

The personas below are derived from the role behaviors implemented in the codebase and the audience-segment analysis in the existing Innovators diploma document. They are illustrative; this project did not conduct primary user research.

### 7.1 Persona — "Aigerim", brand marketing lead

- **Role:** Brand
- **Profile:** Marketing lead at a mid-size Kazakh consumer-goods company.
- **Goal:** Run quarterly Instagram campaigns with five to ten influencers per quarter.
- **Pain points:** Manual Instagram outreach, no centralized contracting, hard to compare ROI across collaborations.
- **AdPartners.kz features used:** `CreateOrder`, `InfluencerList`, `InfluencerRecommendations`, `Matches`, `MatchDetail`, `BrandDashboard`.

### 7.2 Persona — "Daniyar", lifestyle micro-influencer

- **Role:** Influencer
- **Profile:** 30 K Instagram and TikTok followers, lifestyle and fitness niche, based in Almaty.
- **Goal:** Surface his work to local brands and convert opportunities to paid campaigns.
- **Pain points:** Cold outreach is one-sided; opportunities are sporadic; no professional record of past campaigns.
- **AdPartners.kz features used:** `BrandList`, `BrandRecommendations`, `Orders`, `OrderDetail`, `MyApplications`, `Matches`, `InfluencerDashboard`, `Messages`.

## 8. Main user flows

### 8.1 Brand publishes a campaign and selects an influencer

1. Brand registers (`POST /auth/register` with `role: brand`).
2. Brand fills out the profile (`PATCH /profiles/me`).
3. Brand creates an order (`POST /orders` from `pages/brand/CreateOrder`).
4. Brand reviews recommended influencers (`GET /matching/recommendations/influencers`).
5. Influencer applies; brand reviews applications (`GET /order-applications/order/:orderId`).
6. Brand accepts an application (`PATCH /order-applications/:id`).
7. Brand and influencer chat in real time (`POST /chats/:id/messages` + WebSocket).
8. After delivery, brand updates match stats (`PATCH /matching/:id/stats`) and marks the match completed (`PATCH /matching/:id/complete`).
9. Brand reviews dashboard (`GET /statistics/brand`).

### 8.2 Influencer discovers brands and applies

1. Influencer registers (`POST /auth/register` with `role: influencer`).
2. Influencer fills out the profile and adds social-media handles.
3. Influencer browses available orders (`GET /orders/available`).
4. Influencer reads the order detail and applies with a cover letter and proposed price (`POST /order-applications/:orderId`).
5. Influencer follows up via chat once the brand accepts.
6. Influencer reviews their statistics (`GET /statistics/influencer`).

## 9. Functional requirements

### 9.1 Authentication and account management

| ID | Requirement | Status |
|---|---|---|
| FR-001 | The system must allow guests to register as a Brand or Influencer with name, email, password, and role. | Implemented |
| FR-002 | The system must validate that the email is unique and the password is at least 6 characters. | Implemented |
| FR-003 | The system must hash passwords with bcrypt before storage. | Implemented |
| FR-004 | The system must auto-create a Profile of the matching type (`brand` or `influencer`) on registration. | Implemented |
| FR-005 | The system must issue a JWT access token (15 minutes) and a JWT refresh token (7 days, bcrypt-hashed in storage). | Implemented |
| FR-006 | The system must allow a logged-in user to delete their account, cascading to their Profile. | Implemented |
| FR-007 | The system must allow a logged-in user to obtain a new token pair from a valid refresh token. | Implemented |
| FR-008 | The frontend must persist tokens between browser sessions and attach the access token as `Authorization: Bearer ...` to every API request. | Implemented |
| FR-009 | The frontend must clear tokens and redirect to `/login` when an API call returns 401. | Implemented |
| FR-010 | The frontend must automatically refresh an expired access token using the refresh token. | Future improvement |

### 9.2 Profile management

| ID | Requirement | Status |
|---|---|---|
| FR-020 | A user must be able to view and edit their own profile (display name, bio, location, age range, gender, categories, languages). | Implemented |
| FR-021 | A brand user must be able to set company-specific fields (company name, industry). | Implemented |
| FR-022 | An influencer user must be able to set niche, content types, follower count, demographics, metrics, and preferences. | Implemented |
| FR-023 | A user must be able to attach social-media handles for Instagram, TikTok, Facebook, Twitter, Threads, and LinkedIn. | Implemented |
| FR-024 | Any authenticated user must be able to view another user's profile by `userId`. | Implemented |
| FR-025 | A brand must be able to search influencer profiles via `GET /profiles/influencers/search` with arbitrary filter parameters. | Implemented |
| FR-026 | An influencer must be able to search brand profiles via `GET /profiles/brands/search`. | Implemented |
| FR-027 | The system must support uploading avatars from the user's device. | Future improvement (avatars are external URLs only). |

### 9.3 Order management (brand)

| ID | Requirement | Status |
|---|---|---|
| FR-030 | A brand must be able to create an order with title, description, budget, category, requirements, and deadline. | Implemented |
| FR-031 | The system must enforce: title ≥ 3 characters; description ≥ 10 characters; budget ≥ 0; deadline must be a valid date string. | Implemented |
| FR-032 | A brand must be able to list all orders they have created (`GET /orders/brand`). | Implemented |
| FR-033 | A brand must be able to view applications for one of their orders (`GET /order-applications/order/:orderId`). | Implemented |
| FR-034 | A brand must be able to accept or reject an application (`PATCH /order-applications/:id`). | Implemented |
| FR-035 | A brand must be able to mark an accepted match as completed (`PATCH /matching/:id/complete`). | Implemented |
| FR-036 | A brand must be able to edit or cancel an order. | Future improvement. The backend exposes neither `PATCH /orders/:id` nor `DELETE /orders/:id`, so the brand-side Edit/Delete UI is hidden in the demo build. |

### 9.4 Order discovery and application (influencer)

| ID | Requirement | Status |
|---|---|---|
| FR-040 | An influencer must be able to list available orders (`GET /orders/available`) filterable by category and budget range. | Implemented |
| FR-041 | An influencer must be able to view the full detail of an order. | Implemented |
| FR-042 | An influencer must be able to apply to an order with a cover letter and an optional proposed price. | Implemented |
| FR-043 | An influencer must be able to view their own applications grouped by status (pending, accepted, rejected, withdrawn). | Implemented |
| FR-044 | An influencer must be able to withdraw a pending application. | Implemented |

### 9.5 Matching and recommendations

| ID | Requirement | Status |
|---|---|---|
| FR-050 | The system must compute a category-based match score between a brand and an influencer. | Implemented |
| FR-051 | The system must surface top-N recommended influencers for a brand, excluding existing matches. | Implemented |
| FR-052 | The system must surface top-N recommended brands for an influencer, excluding existing matches. | Implemented |
| FR-053 | The match score must integrate audience overlap and engagement signals. | Implemented (deterministic). `audienceMatch` is computed from language and content-type overlap; `engagementScore` from `User.engagementRate` and follower count; `categoryMatch` from Jaccard overlap of `Profile.categories`. See [04_TECHNICAL_DOCUMENTATION.md §11](./04_TECHNICAL_DOCUMENTATION.md). |
| FR-054 | A user must be able to accept or reject a pending match. Acceptance must auto-create a chat between the parties. | Implemented |
| FR-055 | A user must be able to view their current matches and the detail of one match. | Implemented |
| FR-056 | A brand must be able to update match statistics (clicks, impressions, engagement rate, follower growth). | Implemented |

### 9.6 Collaboration management

| ID | Requirement | Status |
|---|---|---|
| FR-060 | A brand or admin must be able to create a Collaboration record optionally linked to an Order. | Implemented |
| FR-061 | A brand must be able to view its active collaborations; an influencer must be able to view theirs. | Implemented |
| FR-062 | A collaboration's status must move through `active → completed | cancelled`. | Implemented |
| FR-063 | An admin must be able to delete a collaboration. | Implemented (admin role only; no admin UI yet). |

### 9.7 Real-time messaging

| ID | Requirement | Status |
|---|---|---|
| FR-070 | A user must be able to open or reuse a chat with any other user (`POST /chats/:recipientId`). | Implemented |
| FR-071 | A user must be able to send a message to a chat; the message must be persisted and delivered in real time to all participants. | Implemented |
| FR-072 | The recipient must receive a `chatUpdated` event with the latest unread count and last message preview. | Implemented |
| FR-073 | A user must be able to mark a chat as read; the `messagesRead` event must be broadcast to the chat room. | Implemented |
| FR-074 | The system must persist messages with sender, recipient, chat reference, and read flag. | Implemented |

### 9.8 Statistics and analytics

| ID | Requirement | Status |
|---|---|---|
| FR-080 | A brand must be able to view aggregate statistics filterable by date range, influencer, and category. | Implemented |
| FR-081 | An influencer must be able to view aggregate statistics filterable by date range, brand, and category. | Implemented |
| FR-082 | The dashboard must display KPI cards, a line chart of daily stats, and a pie chart of campaign distribution. | Partially implemented. KPI cards and pie chart are wired to the aggregated `Match.stats` totals returned by `StatisticsService`. The line chart for daily aggregation is a future improvement (FI-006). |

### 9.9 Settings

| ID | Requirement | Status |
|---|---|---|
| FR-090 | A user must be able to toggle email and push notification preferences. | Future improvement. Currently only the UI exists; preferences are persisted to the user's browser `localStorage` so the toggles survive a refresh. Server-side persistence and a notifications subsystem are listed under §14 (FI-002). |
| FR-091 | A user must be able to choose a UI language and timezone. | Future improvement. Selection is stored in `localStorage` only; no server-side persistence and no full UI translation are in place. |
| FR-092 | A user must be able to delete their account from the Settings page. | Implemented (`DELETE /auth/account`). |

## 10. Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-001 | Passwords must be stored using a one-way hash (bcrypt). | Implemented |
| NFR-002 | All authenticated requests must use a valid JWT in the `Authorization` header. | Implemented |
| NFR-003 | Role-based authorization must be enforced server-side via `RolesGuard`, not by trusting the frontend. | Implemented |
| NFR-004 | Input validation must reject malformed payloads at the API boundary via `class-validator`. | Implemented |
| NFR-005 | The system must support real-time chat with sub-second delivery latency on a local network. | Implemented |
| NFR-006 | The frontend must remain usable on viewports of 1280×720 and above. | Implemented (Chakra UI responsive primitives). |
| NFR-007 | The backend must expose interactive API documentation. | Implemented (Swagger UI at `/docs`). |
| NFR-008 | The backend must run inside Docker, alongside a PostgreSQL container, with `docker-compose up`. | Implemented |
| NFR-009 | The backend must support horizontal scaling. | Future improvement (the WebSocket gateway holds in-memory socket maps; needs a Redis adapter). |
| NFR-010 | Refresh tokens must rotate on every refresh and must be hashed in storage. | Implemented (server-side); rotation on the frontend is `Future improvement`. |
| NFR-011 | Database schema changes must be versioned through migrations in production. | Future improvement (currently `synchronize: true` outside production). |
| NFR-012 | The backend must allow CORS only from the production frontend origin. | Future improvement (currently allow-all). |

## 11. UI / UX requirements

| ID | Requirement | Status |
|---|---|---|
| UX-001 | Authenticated users must land on a role-specific dashboard. | Implemented |
| UX-002 | Navigation items in the sidebar must adapt to the user role. | Implemented |
| UX-003 | The chat interface must list conversations with unread counts and show a typing-style real-time message stream. | Implemented |
| UX-004 | Status badges (order status, application status, match status) must be color-coded and consistent across pages. | Implemented |
| UX-005 | Forms must use field-level validation messages from `react-hook-form` and `class-validator`. | Implemented |
| UX-006 | The Settings page must use confirmation dialogs for irreversible actions (account deletion). | Implemented |

## 12. Acceptance criteria (sample)

| Requirement | Acceptance criterion |
|---|---|
| FR-001 | A guest at `/register` can submit name, email, password, and role; on success the response includes user, accessToken, refreshToken; the user appears in the `users` table; a Profile of the matching type appears in the `profiles` table. |
| FR-030 | A logged-in brand at `/brand/orders/create` can submit a valid form; the new order appears in `GET /orders/brand` with status `open`. |
| FR-042 | A logged-in influencer at `/influencer/orders/:id` can submit a cover letter and optional proposed price; the application appears under their `MyApplications` page with status `pending`; the brand sees it in `GET /order-applications/order/:orderId`. |
| FR-051 | A logged-in brand calls `GET /matching/recommendations/influencers` and receives a JSON array sorted by `matchScore` descending, with no influencer that already has a Match record with this brand. |
| FR-070 / FR-071 | When user A sends a message in a chat with user B, user B's open `Messages` page receives the new message via WebSocket without page refresh. |

## 13. Limitations

- No admin user interface exists; admin-only endpoints are reachable only by a user manually given `role = 'admin'` in the database.
- File uploads (avatars, campaign assets) are not implemented; URLs must be supplied by the client.
- Notification (e-mail, in-app) and refresh-token rotation on the frontend are not implemented.
- Daily stats aggregation is not implemented; charts use Match-level totals.
- The recommendation listing endpoints rank purely by `categoryMatch`. The full three-factor score (`categoryMatch`, `audienceMatch`, `engagementScore`) is exposed by `POST /matching/calculate` and is intended to be wired into the listing endpoints in a follow-up iteration.
- The `Brand` and `messages` modules duplicate functionality already present in `User`+`Profile` and `chats`; the team should consolidate before scaling.

## 14. Future improvements

| ID | Improvement | Rationale |
|---|---|---|
| FI-001 | Implement an admin dashboard with user moderation, dispute resolution, and platform-wide analytics. | The `admin` role is enumerated but unused. |
| FI-002 | Implement a notifications subsystem (email and in-app) for new messages, application status changes, and approaching deadlines. | Currently only real-time chat updates are pushed to the user. |
| FI-003 | Implement file uploads with object storage (S3-compatible). | Avatars and proof-of-work assets currently must be hosted externally. |
| FI-004 | Implement frontend refresh-token rotation. | Avoids forcing users back to the login screen every 15 minutes. |
| FI-005 | Wire the full deterministic match-score (categoryMatch + audienceMatch + engagementScore) into the recommendation listing endpoints, and enrich `audienceMatch` with demographic overlap. | The score is already computed by `POST /matching/calculate`; the listing endpoints currently rank by `categoryMatch` only. |
| FI-006 | Implement daily-stat aggregation in the Statistics service. | Required for the line-chart timeline that the dashboard already renders. |
| FI-007 | Introduce a Redis adapter for Socket.io. | Enables horizontal scaling of the chat gateway. |
| FI-008 | Add migrations and disable `synchronize` outside development. | Required for production safety. |
| FI-009 | Remove the parallel `Brand` standalone entity (the canonical brand flow is `User` + `Profile (type='brand')`). | Reduces dead code. The previously parallel `messages` module has already been consolidated into `chats`. |
| FI-010 | Add unit and end-to-end tests for matching, auth, and chat flows. | Currently only boilerplate tests exist. |
