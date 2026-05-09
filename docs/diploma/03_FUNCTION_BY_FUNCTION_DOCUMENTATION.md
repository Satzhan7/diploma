# 03 — Function-by-Function Documentation

This document describes each user-facing function of AdPartners.kz that is present in the source code. Functions are grouped by domain. Each entry follows the same template (Purpose, User Role, Location, Input Data, Process, Output, Validation Rules, Backend/API Interaction, Database Interaction, Error Handling, Example Scenario, Status). Requirement IDs reference the Product Requirements Document ([02_PRODUCT_REQUIREMENTS_DOCUMENT.md](./02_PRODUCT_REQUIREMENTS_DOCUMENT.md)).

---

## A. Authentication and account

### A.1 Landing page

#### Purpose
Provide a public marketing page that introduces AdPartners.kz to first-time visitors and routes returning users to their dashboard.

#### User Role
Guest. Authenticated users are redirected to their dashboard automatically.

#### Location
- Frontend route: `/`
- Page component: `frontend/src/pages/Landing.tsx`

#### Input Data
None.

#### Process
1. The router renders `Landing` when `isAuthenticated` is `false`.
2. The page presents the value proposition, feature blocks, and call-to-action buttons that link to `/login` and `/register`.

#### Output
The marketing landing page (HTML).

#### Validation Rules
None.

#### Backend/API Interaction
None.

#### Database Interaction
None.

#### Error Handling
None.

#### Example Scenario
A first-time visitor opens `https://adpartners.kz/` and sees the landing page; clicking "Get Started" sends them to `/register`.

#### Status
Implemented.

---

### A.2 Registration

#### Purpose
Create a new Brand or Influencer account and issue authentication tokens.

#### User Role
Guest.

#### Location
- Frontend route: `/register`
- Page component: `frontend/src/pages/Register.tsx`
- Service call: `frontend/src/contexts/AuthContext.tsx` → `register()`

#### Input Data
- `name` (full name)
- `email`
- `password` (≥ 6 characters)
- `role` (`brand` or `influencer`)

#### Process
1. The user fills out the form and clicks "Register".
2. The frontend calls `POST /auth/register` with the four fields.
3. The backend (`AuthService.register`, `backend/src/auth/auth.service.ts:19-38`) validates that the email is unique, hashes the password, creates the User, and immediately creates a Profile of the matching `ProfileType`.
4. The backend issues a JWT access token (15 m) and a JWT refresh token (7 d), stores a bcrypt hash of the refresh token on `users.refreshToken`, and returns the user with both tokens.
5. The frontend persists both tokens to `localStorage` and updates `AuthContext.user`.
6. `App.tsx` redirects the user to `/brand/dashboard` or `/influencer/dashboard` based on the role.

#### Output
The user is logged in and redirected to their role-specific dashboard.

#### Validation Rules
`RegisterDto` (`backend/src/auth/dto/register.dto.ts`): `@IsEmail()` on `email`; `@IsString() @MinLength(6)` on `password`; `@IsString()` on `name`; `@IsEnum(UserRole)` on `role`.

#### Backend/API Interaction
- `AuthController.register` ([backend/src/auth/auth.controller.ts:15-22](../../backend/src/auth/auth.controller.ts#L15-L22))
- `AuthService.register` ([backend/src/auth/auth.service.ts:19-38](../../backend/src/auth/auth.service.ts#L19-L38))
- `UsersService.create`, `ProfilesService.createProfile`, `UsersService.updateRefreshToken`

#### Database Interaction
INSERT into `users`, INSERT into `profiles`, UPDATE `users.refreshToken`.

#### Error Handling
- 400 Bad Request — DTO validation failure.
- 409 Conflict — `ConflictException('User with this email already exists')`.

#### Example Scenario
"Aigerim" submits `name="Aigerim K."`, `email="aigerim@brand.kz"`, `password="secret123"`, `role="brand"`. The platform creates her User and Profile, returns tokens, and routes her to `/brand/dashboard`.

#### Status
Implemented. Requirements: FR-001 to FR-005.

---

### A.3 Login

#### Purpose
Authenticate an existing user and issue a fresh token pair.

#### User Role
Guest.

#### Location
- Frontend route: `/login`
- Page component: `frontend/src/pages/Login.tsx`

#### Input Data
- `email`
- `password`

#### Process
1. The user submits the login form.
2. The frontend calls `POST /auth/login`.
3. `AuthService.login` ([backend/src/auth/auth.service.ts:40-58](../../backend/src/auth/auth.service.ts#L40-L58)) loads the user by email, runs `bcrypt.compare` against the stored hash, and on success issues a new token pair.
4. The frontend persists both tokens and sets `AuthContext.user`.

#### Output
Authenticated session; redirect to the role dashboard.

#### Validation Rules
`LoginDto` enforces `@IsEmail()` on `email` and `@IsString()` on `password`.

#### Backend/API Interaction
`AuthController.login`, `AuthService.login`.

#### Database Interaction
SELECT from `users`; UPDATE `users.refreshToken`.

#### Error Handling
- 401 Unauthorized — `UnauthorizedException('Invalid credentials')` for unknown email or wrong password.
- 400 Bad Request — DTO validation failure.

#### Example Scenario
"Daniyar" enters his email and password; the platform issues tokens and routes him to `/influencer/dashboard`.

#### Status
Implemented.

---

### A.4 JWT-protected request

#### Purpose
Allow a logged-in user to call any guarded endpoint by attaching their access token.

#### User Role
Authenticated user (any role unless the route uses `@Roles(...)`).

#### Location
Cross-cutting. Implemented at the framework level.

#### Input Data
`Authorization: Bearer <accessToken>` header.

#### Process
1. The Axios interceptor in [frontend/src/services/api.ts](../../frontend/src/services/api.ts) reads `localStorage.accessToken` and attaches it to every outgoing request.
2. The backend's global `JwtAuthGuard` runs the Passport `JwtStrategy` ([backend/src/auth/strategies/jwt.strategy.ts](../../backend/src/auth/strategies/jwt.strategy.ts)). It verifies the signature and reloads the user from the database.
3. The user object is attached to `request.user` and is available via `@GetCurrentUser()` and `@GetUser()` decorators.

#### Output
The protected handler runs and returns its response.

#### Validation Rules
`JwtAuthGuard` honours `@Public()` to bypass the check on selected endpoints.

#### Backend/API Interaction
Every controller annotated with `@UseGuards(JwtAuthGuard)`.

#### Database Interaction
SELECT from `users` on every authenticated request (in `JwtStrategy.validate`).

#### Error Handling
- 401 Unauthorized — missing, malformed, expired, or unknown token.

#### Example Scenario
The frontend calls `GET /profiles/me`; the access token is attached automatically; the backend returns the user's profile.

#### Status
Implemented. Requirements: NFR-002.

---

### A.5 Refresh access token

#### Purpose
Exchange a valid refresh token for a new access + refresh pair.

#### User Role
Anyone holding a valid refresh token (the endpoint is `@Public()`).

#### Location
Backend only. The frontend currently does not invoke this endpoint automatically (`Future improvement`).

#### Input Data
`{ refreshToken: string }` in the JSON body.

#### Process
1. The endpoint (`AuthController.refresh`) receives the refresh token.
2. `AuthService.refreshTokens` ([backend/src/auth/auth.service.ts:60-85](../../backend/src/auth/auth.service.ts#L60-L85)) verifies the JWT, looks up the user, and `bcrypt.compare`s the provided token against `users.refreshToken`.
3. On success, a new pair is issued and the new refresh token is hashed and stored.

#### Output
`{ accessToken, refreshToken }`.

#### Validation Rules
The token must be a valid JWT and must match the bcrypt hash stored on the user.

#### Backend/API Interaction
`POST /auth/refresh`, `AuthService.refreshTokens`.

#### Database Interaction
SELECT and UPDATE on `users.refreshToken`.

#### Error Handling
- 401 Unauthorized — invalid signature, missing user, mismatched bcrypt comparison.

#### Example Scenario
A future frontend version observes a 401 with code "expired", calls `POST /auth/refresh` with the stored refresh token, and seamlessly retries the original request.

#### Status
Implemented (server-side); frontend integration is `Future improvement`.

---

### A.6 Delete account

#### Purpose
Allow a user to permanently remove their account.

#### User Role
Authenticated user.

#### Location
- Frontend page: `frontend/src/pages/Settings.tsx`
- Service call: `AuthContext.deleteAccount`

#### Input Data
None (the user is identified via the JWT).

#### Process
1. The user clicks "Delete Account" and confirms in the modal.
2. The frontend calls `DELETE /auth/account`.
3. `AuthService.deleteAccount` ([backend/src/auth/auth.service.ts:115-141](../../backend/src/auth/auth.service.ts#L115-L141)) deletes the Profile (if any) and then the User.
4. The frontend logs the user out and redirects to `/`.

#### Output
Confirmation message; logout.

#### Validation Rules
JWT must be valid.

#### Backend/API Interaction
`AuthController.deleteAccount` (`@UseGuards(JwtAuthGuard)`), `AuthService.deleteAccount`.

#### Database Interaction
DELETE from `profiles`, DELETE from `users`.

#### Error Handling
- 401 Unauthorized — invalid token.
- 404 Not Found — user record missing.

#### Example Scenario
A user decides to leave the platform, confirms account deletion in Settings, and is signed out.

#### Status
Implemented. Requirements: FR-006, FR-092.

---

### A.7 Logout

#### Purpose
End the current session in the browser.

#### User Role
Authenticated user.

#### Location
- `AuthContext.logout` (`frontend/src/contexts/AuthContext.tsx`)
- Triggered from the dashboard layout sidebar.

#### Input Data
None.

#### Process
1. Remove `accessToken` and `refreshToken` from `localStorage`.
2. Set `AuthContext.user` to `null`.
3. The router redirects unauthenticated users to `/`.

#### Output
The user is returned to the public landing page.

#### Validation Rules
None.

#### Backend/API Interaction
None — there is no server-side logout endpoint. The refresh token remains hashed on the user record until the next refresh-token rotation.

#### Database Interaction
None.

#### Error Handling
None.

#### Example Scenario
A user clicks "Logout" in the sidebar; the SPA clears tokens and redirects to `/`.

#### Status
Implemented (frontend-only).

---

## B. Profile

### B.1 View own profile

#### Purpose
Show the logged-in user their own profile data.

#### User Role
Authenticated user.

#### Location
- Frontend route: `/brand/profile` or `/influencer/profile`
- Page component: `frontend/src/pages/Profile.tsx`

#### Input Data
None (user identified via JWT).

#### Process
1. The page calls `GET /profiles/me`.
2. The Profile is rendered with avatar, bio, location, social-media links, categories, languages, etc.

#### Output
A profile view with edit buttons.

#### Backend/API Interaction
`ProfilesController.getMyProfile` ([backend/src/profiles/profiles.controller.ts:29-32](../../backend/src/profiles/profiles.controller.ts#L29-L32)).

#### Database Interaction
SELECT from `profiles` joined to `social_media`.

#### Error Handling
- 401 Unauthorized; 404 if Profile missing (rare; auto-created on register).

#### Example Scenario
A brand opens their own profile to verify how their company name renders.

#### Status
Implemented. Requirement FR-020.

---

### B.2 Edit own profile

#### Purpose
Update profile fields and social-media handles.

#### User Role
Authenticated user.

#### Location
- Frontend route: `/brand/profile/edit` or `/influencer/profile/edit`
- Page component: `frontend/src/pages/EditProfile.tsx`

#### Input Data
`UpdateProfileDto` (`backend/src/profiles/dto/update-profile.dto.ts`): `firstName`, `lastName`, `bio`, `avatarUrl`, `ageRange`, `gender`, `location`, `interests`, `categories`, `isSubscribedToOrders`, plus brand-specific (`companyName`, `industry`) or influencer-specific (`niches`, `contentTypes`, `metrics`, `demographics`, `preferences`) fields. Nested `socialMedia` array of `{ type, url, username, followers }`.

#### Process
1. The form pre-fills from `GET /profiles/me`.
2. On submit, the frontend calls `PATCH /profiles/me` with the changed fields.
3. `ProfilesService.updateProfile` updates the Profile and cascades into `social_media`.

#### Output
The new profile is returned and the page navigates back to view mode.

#### Validation Rules
DTO validation via `class-validator` decorators on `UpdateProfileDto`.

#### Backend/API Interaction
`ProfilesController.updateMyProfile` ([backend/src/profiles/profiles.controller.ts:34-42](../../backend/src/profiles/profiles.controller.ts#L34-L42)).

#### Database Interaction
UPDATE on `profiles`; INSERT/UPDATE/DELETE on `social_media` via cascade.

#### Error Handling
- 400 Bad Request — DTO failures.
- 401 Unauthorized.

#### Example Scenario
"Daniyar" adds his Instagram and TikTok handles and a new niche tag.

#### Status
Implemented. Requirements: FR-020 to FR-023.

---

### B.3 View counterpart's profile

#### Purpose
Allow a user to view another user's public profile.

#### User Role
Authenticated user.

#### Location
- Frontend route: `/brand/profile/:userId` or `/influencer/profile/:userId`
- Page component: `Profile` rendered with `isViewMode={true}`

#### Input Data
Path parameter `userId`.

#### Process
1. The page calls `GET /profiles/:userId`.
2. The profile is rendered without edit affordances. Action buttons depend on the viewer's role (brand sees "Match", influencer sees "Apply").

#### Output
A read-only profile view with role-appropriate actions.

#### Backend/API Interaction
`ProfilesController.getProfileByUserId` ([backend/src/profiles/profiles.controller.ts:44-47](../../backend/src/profiles/profiles.controller.ts#L44-L47)).

#### Database Interaction
SELECT from `profiles` joined to `social_media`.

#### Error Handling
- 401, 404.

#### Example Scenario
"Aigerim" clicks an influencer card and reviews his content categories before sending a match.

#### Status
Implemented. Requirement FR-024.

---

### B.4 Influencer search (brand-only)

#### Purpose
Let a brand find influencers using filter criteria.

#### User Role
Brand.

#### Location
- Frontend page: `frontend/src/pages/brand/InfluencerList.tsx`

#### Input Data
Free-form query string with filters such as `?category=`, `?language=`, `?industry=`.

#### Process
1. The frontend calls `GET /profiles/influencers/search?...`.
2. `ProfilesService.findInfluencersForBrand` filters Profiles where `type = 'influencer'`.

#### Output
A grid of `InfluencerCard` components.

#### Backend/API Interaction
`ProfilesController.findInfluencers` (`@Roles('brand')`).

#### Database Interaction
SELECT from `profiles` joined to `social_media` and `users`.

#### Error Handling
- 401, 403 if the user is not a brand.

#### Example Scenario
"Aigerim" filters by `category=fashion` and is shown only fashion influencers.

#### Status
Implemented. Requirement FR-025.

---

### B.5 Brand search (influencer-only)

#### Purpose
Let an influencer find brands.

#### User Role
Influencer.

#### Location
- Frontend page: `frontend/src/pages/influencer/BrandList.tsx`

#### Input Data
Free-form query string.

#### Process
Mirrors B.4 but with `@Roles('influencer')` and `type = 'brand'`.

#### Backend/API Interaction
`ProfilesController.findBrands`.

#### Status
Implemented. Requirement FR-026.

---

## C. Order workflow

### C.1 Create order (brand)

#### Purpose
Publish a new campaign that influencers can apply to.

#### User Role
Brand.

#### Location
- Frontend route: `/brand/orders/create`
- Page component: `frontend/src/pages/brand/CreateOrder.tsx`

#### Input Data
`CreateOrderDto` (`backend/src/orders/dto/create-order.dto.ts`): `title` (≥ 3), `description` (≥ 10), `budget` (≥ 0), `category`, `requirements`, `deadline` (ISO date string).

#### Process
1. The brand fills the form.
2. The frontend calls `POST /orders` with the DTO.
3. `OrdersController.create` ([backend/src/orders/orders.controller.ts:19-28](../../backend/src/orders/orders.controller.ts#L19-L28)) hands off to `OrdersService.create`, which inserts the row and links the brand profile.
4. The page navigates back to `/brand/orders`.

#### Output
The new order is visible in `GET /orders/brand` with status `open`.

#### Validation Rules
DTO decorators (see Input Data).

#### Backend/API Interaction
`POST /orders`, role `brand`.

#### Database Interaction
INSERT into `orders`.

#### Error Handling
- 400 invalid body; 401, 403.

#### Example Scenario
"Aigerim" creates a $1 000 fashion campaign with deadline `2025-09-01`.

#### Status
Implemented. Requirements: FR-030, FR-031.

---

### C.2 Brand: list own orders

#### Purpose
Show the brand the campaigns they have published.

#### User Role
Brand.

#### Location
- Frontend page: `frontend/src/pages/brand/Orders.tsx`

#### Input Data
None.

#### Process
1. The page calls `GET /orders/brand`.
2. Each order is rendered with status badge and an "Applicants" button that opens the applications modal.

#### Backend/API Interaction
`OrdersController.findBrandOrders`.

#### Database Interaction
SELECT from `orders` filtered by `brand_id`.

#### Status
Implemented. Requirement FR-032.

---

### C.3 Influencer: list available orders

#### Purpose
Show the influencer all currently open campaigns.

#### User Role
Influencer.

#### Location
- Frontend route: `/influencer/orders`
- Page component: `frontend/src/pages/influencer/Orders.tsx`

#### Input Data
Optional query: `category`, `minBudget`, `maxBudget`.

#### Process
The frontend calls `GET /orders/available?...`.

#### Backend/API Interaction
`OrdersController.findAvailable`.

#### Database Interaction
SELECT from `orders` where `status = 'open'` (filtered).

#### Status
Implemented. Requirement FR-040.

---

### C.4 View order detail

#### Purpose
Read the full description of an order before applying.

#### User Role
Authenticated user (typically influencer).

#### Location
- Frontend route: `/influencer/orders/:orderId`
- Page component: `frontend/src/pages/influencer/OrderDetail.tsx`

#### Input Data
Path parameter `orderId`.

#### Process
The page fetches `GET /orders/:id` and renders title, description, requirements, budget, deadline, brand reference, and an "Apply" form.

#### Backend/API Interaction
`OrdersController.findOne`.

#### Database Interaction
SELECT from `orders` joined to brand `profiles` and `users`.

#### Status
Implemented. Requirement FR-041.

---

### C.5 Apply to order (influencer)

#### Purpose
Submit a formal application with cover letter and proposed price.

#### User Role
Influencer.

#### Location
- Form on `OrderDetail.tsx`.

#### Input Data
`CreateOrderApplicationDto`: `message` (non-empty), `proposedPrice` (optional number).

#### Process
1. The influencer submits the form.
2. The frontend calls `POST /order-applications/:orderId`.
3. `OrderApplicationsService.create` inserts a row with status `pending`.
4. The application appears under "My Applications".

#### Output
A new pending application.

#### Validation Rules
`@IsString() @IsNotEmpty()` on `message`; `@IsNumber() @IsOptional()` on `proposedPrice`.

#### Backend/API Interaction
`OrderApplicationsController.create` (`@Roles('influencer')`).

#### Database Interaction
INSERT into `order_application`.

#### Error Handling
- 400, 401, 403, 404.

#### Example Scenario
"Daniyar" applies to "Aigerim's" fashion campaign with a $400 proposed price.

#### Status
Implemented. Requirement FR-042.

---

### C.6 List my applications (influencer)

#### Purpose
Allow influencers to track their applications by status.

#### User Role
Influencer.

#### Location
- Frontend route: `/influencer/applications`
- Page component: `frontend/src/pages/influencer/MyApplications.tsx`

#### Input Data
None.

#### Process
The page calls `GET /order-applications` and groups results into tabs (pending, accepted, rejected, withdrawn).

#### Backend/API Interaction
`OrderApplicationsController.findAll`.

#### Database Interaction
SELECT from `order_application` where `applicantId = current user`.

#### Status
Implemented. Requirement FR-043.

---

### C.7 Brand: view applications for an order

#### Purpose
Allow brands to review applicants for one of their orders.

#### User Role
Brand.

#### Location
Modal on `frontend/src/pages/brand/Orders.tsx`.

#### Input Data
Path parameter `orderId`.

#### Process
The modal calls `GET /order-applications/order/:orderId` and lists applications with applicant profile data, message, proposed price.

#### Backend/API Interaction
`OrderApplicationsController.findByOrder` (`@Roles('brand')`).

#### Database Interaction
SELECT from `order_application` joined to `users` (applicant) and `orders`.

#### Status
Implemented. Requirement FR-033.

---

### C.8 Brand: accept or reject an application

#### Purpose
Allow the brand to make a decision on an application.

#### User Role
Brand.

#### Location
The applications modal on `pages/brand/Orders.tsx`.

#### Input Data
`UpdateOrderApplicationDto` with the new status (`accepted` or `rejected`).

#### Process
1. Brand clicks Accept or Reject in the modal.
2. The frontend calls `PATCH /order-applications/:id`.
3. The application status is updated and reflected on the influencer's `MyApplications` page.

#### Backend/API Interaction
`OrderApplicationsController.update`.

#### Database Interaction
UPDATE on `order_application.status`.

#### Status
Implemented. Requirement FR-034.

---

### C.9 Influencer: withdraw application

#### Purpose
Allow influencers to retract an application.

#### User Role
Influencer.

#### Location
`MyApplications.tsx`, with confirmation dialog.

#### Input Data
Path parameter `id`.

#### Process
The frontend calls `DELETE /order-applications/:id`. The handler updates the status to `withdrawn` (it does not physically delete the row — see [order-applications.controller.ts:90-103](../../backend/src/orders/order-applications.controller.ts#L90-L103)).

#### Backend/API Interaction
`OrderApplicationsController.withdraw` (`@Roles('influencer')`).

#### Database Interaction
UPDATE on `order_application.status`.

#### Status
Implemented. Requirement FR-044.

---

## D. Matching and recommendations

### D.1 Recommended influencers (brand)

#### Purpose
Surface a sorted list of influencers most relevant to the brand's profile.

#### User Role
Brand.

#### Location
- Frontend page: `frontend/src/pages/brand/InfluencerRecommendations.tsx`

#### Input Data
Optional `?limit=` query.

#### Process
1. The page calls `GET /matching/recommendations/influencers?limit=10`.
2. `MatchingService.getRecommendedInfluencersForBrand` ([backend/src/matching/matching.service.ts:177-209](../../backend/src/matching/matching.service.ts#L177-L209)) loads all influencers, excludes ones with whom a Match already exists, scores them by `categoryMatch * 100`, and returns the top `limit`.
3. The page renders cards sorted descending by `matchScore`.

#### Output
`[{ user, matchScore }]` sorted descending.

#### Backend/API Interaction
`MatchingController.getRecommendedInfluencers` (`@Roles('brand')`).

#### Database Interaction
SELECT from `users` (with Profile join), SELECT from `match` to exclude existing matches.

#### Error Handling
- 401, 403, 404 if the brand id is not found.

#### Example Scenario
"Aigerim" sees the top 10 fashion influencers ranked by category overlap.

#### Status
Implemented. The `audienceMatch` and `engagementScore` factors used in `calculateMatchScore` (D.4) are not yet integrated here; this is `Future improvement` (FI-005).

---

### D.2 Recommended brands (influencer)

#### Purpose
Surface brands whose categories overlap the influencer's.

#### User Role
Influencer.

#### Location
- Frontend route: `/influencer/recommendations`
- Page component: `frontend/src/pages/influencer/BrandRecommendations.tsx`

#### Input Data
Optional `?limit=`.

#### Process
Mirror of D.1, with `MatchingService.getRecommendedBrandsForInfluencer`.

#### Backend/API Interaction
`MatchingController.getRecommendedBrands` (`@Roles('influencer')`).

#### Status
Implemented. Requirement FR-052.

---

### D.3 List user matches

#### Purpose
Show all matches involving the current user.

#### User Role
Brand or Influencer.

#### Location
- Frontend route: `/brand/matches` or `/influencer/matches`
- Page component: `frontend/src/pages/Matches.tsx`

#### Input Data
None.

#### Process
The page calls `GET /matching/user/matches` and renders matches as cards with status badges and accept/reject buttons.

#### Backend/API Interaction
`MatchingController.getMatchesForUser`.

#### Database Interaction
SELECT from `match` where `brandId = current` or `influencerId = current`.

#### Status
Implemented. Requirement FR-055.

---

### D.4 Calculate match score

#### Purpose
Return a non-persisted breakdown of the match score for a brand × influencer pair.

#### User Role
Brand or Influencer.

#### Location
Used by ad-hoc UI flows (e.g. "Match" button on a counterpart's profile).

#### Input Data
`{ brandId, influencerId }`.

#### Process
1. The frontend calls `POST /matching/calculate`.
2. `MatchingService.calculateMatchScore` ([backend/src/matching/matching.service.ts](../../backend/src/matching/matching.service.ts)) computes three deterministic factors and a weighted total:
   - `categoryMatch` — Jaccard overlap of `Profile.categories` between brand and influencer (`|B ∩ I| / |B ∪ I|`, lower-cased).
   - `audienceMatch` — Jaccard overlap of `Profile.languages` (60 % weight) and `Profile.contentTypes` (40 %); falls back to whichever signal is available when one side is missing data.
   - `engagementScore` — `0.7 × min(User.engagementRate, 1) + 0.3 × min(User.followers / 100000, 1)`, capped at 1.
   - Weighted sum: `0.4 × categoryMatch + 0.3 × audienceMatch + 0.3 × engagementScore`, scaled to `[0, 100]`.
3. Returns the breakdown.

#### Output
`{ categoryMatch, audienceMatch, engagementScore, totalScore }`.

#### Backend/API Interaction
`MatchingController.calculateMatch`.

#### Status
Implemented. The score is fully deterministic — there are no random terms. Wiring this full score into the recommendation listing endpoints (`GET /matching/recommendations/*`, currently rank by `categoryMatch` only) is a documented future improvement (FI-005).

---

### D.5 Accept or reject a match

#### Purpose
Let a participant transition a `pending` match to `accepted` or `rejected`.

#### User Role
Brand or Influencer.

#### Location
- Frontend page: `frontend/src/pages/Matches.tsx`

#### Input Data
Path parameter `id`.

#### Process
1. User clicks Accept or Reject.
2. The frontend calls `POST /matching/:id/accept` or `POST /matching/:id/reject`.
3. `MatchingService.acceptMatch` transitions the status to `accepted` and seeds a chat between the participants via `ChatsService.create` (idempotent — returns the existing chat if any) and `ChatsService.addMessage`, posting an initial system-style message ("Match accepted! Let's start collaborating."). `rejectMatch` simply updates the status.

#### Backend/API Interaction
`MatchingController.acceptMatch`, `MatchingController.rejectMatch`.

#### Database Interaction
UPDATE on `match.status`; for accept, INSERT into `chat` and `message`.

#### Error Handling
- 400 if the match is not currently `pending`.

#### Status
Implemented. Requirement FR-054.

---

### D.6 Update match statistics

#### Purpose
Allow either party to record the performance of an active match.

#### User Role
Brand or Influencer.

#### Location
- Modal: `frontend/src/components/UpdateStatsModal.tsx`
- Triggered from `MatchDetail.tsx`.

#### Input Data
`UpdateMatchStatsDto`: any subset of `clicks`, `impressions`, `engagementRate`, `followerGrowth`.

#### Process
1. User opens the modal and submits the form.
2. The frontend calls `PATCH /matching/:id/stats`.
3. `MatchingService.updateMatchStats` increments counters and stores the latest engagement rate.

#### Backend/API Interaction
`MatchingController.updateStats`.

#### Database Interaction
UPDATE on `match.stats`.

#### Status
Implemented. Requirement FR-056.

---

### D.7 Complete a match

#### Purpose
Mark a previously accepted match as completed.

#### User Role
Brand.

#### Location
`MatchDetail.tsx`.

#### Input Data
Path parameter `id`.

#### Process
The frontend calls `PATCH /matching/:id/complete`. The service rejects the call if the match is not in `accepted` state.

#### Backend/API Interaction
`MatchingController.completeMatch` (`@Roles('brand')`).

#### Database Interaction
UPDATE on `match.status`.

#### Status
Implemented. Requirement FR-035.

---

## E. Collaboration

### E.1 Create a collaboration

#### Purpose
Record a long-running brand–influencer engagement, optionally tied to an order.

#### User Role
Brand or Admin.

#### Location
Triggered from administrative flows. No dedicated UI is bundled in the current frontend (`Future improvement`).

#### Input Data
`CreateCollaborationDto`: `brandId`, `influencerId`, optional `orderId`, optional `status`, optional `notes`.

#### Backend/API Interaction
`CollaborationsController.create` (`@Roles('brand', 'admin')`).

#### Database Interaction
INSERT into `collaboration`.

#### Status
Implemented (API). Requirement FR-060.

---

### E.2 List collaborations by role

#### Purpose
Provide each user with a list of their collaborations.

#### Backend/API Interaction
- `GET /collaborations/brand` (`@Roles('brand')`) — `CollaborationsController.findBrandCollaborations`.
- `GET /collaborations/influencer` (`@Roles('influencer')`) — `CollaborationsController.findInfluencerCollaborations`.
- `GET /collaborations` (`@Roles('admin')`).

#### Status
Implemented. Requirement FR-061.

---

### E.3 Update or delete a collaboration

#### Purpose
Lifecycle management for a collaboration.

#### Backend/API Interaction
- `PATCH /collaborations/:id` (`@Roles('brand', 'admin')`).
- `DELETE /collaborations/:id` (`@Roles('admin')`).

#### Status
Implemented. Requirements FR-062, FR-063.

---

## F. Real-time messaging

### F.1 List my chats

#### Purpose
Show all conversations the user is part of.

#### User Role
Authenticated user.

#### Location
- Frontend route: `/brand/messages` or `/influencer/messages`
- Page component: `frontend/src/pages/Messages.tsx`

#### Input Data
None.

#### Process
The page calls `GET /chats` and renders a list with unread counts.

#### Backend/API Interaction
`ChatsController.findAll`.

#### Database Interaction
SELECT from `chat` where the user is sender or recipient.

#### Status
Implemented.

---

### F.2 Open or create a chat with a counterpart

#### Purpose
Initiate a conversation with another user.

#### Input Data
Path parameter `recipientId`.

#### Process
1. The frontend calls `POST /chats/:recipientId`.
2. `ChatsService.create` returns the existing chat if any; otherwise it creates a new one with `unreadCount = 0`.
3. The gateway emits `newChat` to both participants.

#### Backend/API Interaction
`ChatsController.create`.

#### Status
Implemented. Requirement FR-070.

---

### F.3 View messages in a chat

#### Purpose
Render the conversation history.

#### Input Data
Path parameter `id` (chat id).

#### Process
The frontend calls `GET /chats/:id/messages`. The service returns messages joined with sender, recipient, and chat references.

#### Backend/API Interaction
`ChatsController.getMessages`.

#### Database Interaction
SELECT from `message` where `chatId = id`.

#### Status
Implemented.

---

### F.4 Send a message

#### Purpose
Append a message to a chat and deliver it in real time.

#### Input Data
`{ content: string }`.

#### Process
1. The frontend calls `POST /chats/:id/messages` (or the workaround `POST /chats/:id/messages/direct`).
2. `ChatsService.addMessage` validates content, persists the message, increments `chat.unreadCount`, and calls `ChatsGateway.emitNewMessage`.
3. The gateway broadcasts `newMessage` to all sockets in `chat:{id}` and `chatUpdated` to the recipient's `user:{recipientId}` room.

#### Output
The persisted Message JSON.

#### Validation Rules
`content` must not be empty (controller-level check).

#### Backend/API Interaction
`ChatsController.addMessage` and `addMessageDirect`.

#### Database Interaction
INSERT into `message`, UPDATE `chat.unreadCount`.

#### Error Handling
- 400 empty content; 401; 403, 404 if the chat is inaccessible.

#### Status
Implemented. Requirements FR-071, FR-072.

---

### F.5 Mark chat as read

#### Purpose
Reset the unread counter and notify the sender.

#### Input Data
Path parameter `id`.

#### Process
1. The frontend calls `POST /chats/:id/read`.
2. `ChatsService.markAsRead` updates each message's `isRead = true` (where the user is recipient), resets `chat.unreadCount = 0`, and emits `messagesRead`.

#### Backend/API Interaction
`ChatsController.markAsRead`.

#### Database Interaction
UPDATE on `message.isRead` and `chat.unreadCount`.

#### Status
Implemented. Requirement FR-073.

---

## G. Statistics and dashboards

### G.1 Brand dashboard

#### Purpose
Show a brand its KPIs and campaign distribution.

#### User Role
Brand.

#### Location
- Frontend route: `/brand/dashboard`
- Page component: `frontend/src/pages/brand/Dashboard.tsx`

#### Input Data
Optional date range, influencer, and category filters.

#### Process
1. The page calls `GET /statistics/brand?startDate=...`.
2. `StatisticsService.getBrandStats` aggregates Match data into totals (matches, clicks, impressions, follower growth) and a campaign-distribution array.
3. The page renders KPI cards, a line chart (illustrative — daily aggregation is a future improvement), a pie chart, and a stats table.

#### Backend/API Interaction
`StatisticsController.getBrandStats` (`@Roles('brand')`).

#### Database Interaction
SELECT (with aggregates) from `match` joined to `users` and `profiles`.

#### Error Handling
- 401, 403.

#### Status
Partially implemented. Requirement FR-080, FR-082.

---

### G.2 Influencer dashboard

#### Purpose
Show an influencer the same KPIs from their perspective.

#### Backend/API Interaction
`StatisticsController.getInfluencerStats` (`@Roles('influencer')`).

#### Status
Partially implemented. Requirements FR-081, FR-082.

---

## H. Settings

### H.1 Notification, language, and timezone preferences

#### Purpose
Allow users to control notification channels and locale.

#### User Role
Authenticated user.

#### Location
- Frontend route: `/brand/settings` or `/influencer/settings`
- Page component: `frontend/src/pages/Settings.tsx`

#### Input Data
Toggles for email and push notifications, language dropdown, timezone dropdown.

#### Process
On submit the page serialises the form into an object and writes it to `localStorage` under the key `adpartners.userSettings`. The form is hydrated from the same key on page load.

#### Backend/API Interaction
None. There is no `/users/settings` endpoint on the backend; preferences are stored client-side only. A server-side notifications subsystem with persisted preferences is listed under `Future improvement` (FI-002).

#### Status
Partially implemented (UI + client-side persistence). Requirements FR-090, FR-091 — see PRD.

---

### H.2 Account deletion

Same as A.6.

#### Status
Implemented.

---

## I. User directories

### I.1 List all influencers

#### Purpose
Public directory of influencers.

#### User Role
Authenticated user. The `/users` controller is now protected by `JwtAuthGuard`, so unauthenticated requests are rejected with HTTP 401.

#### Backend/API Interaction
`UsersController.findInfluencers` (`GET /users/influencers`).

#### Status
Implemented.

---

### I.2 List all brands

`GET /users/brands` — same characteristics as I.1.

---

## J. Maintenance / debug endpoints (chats)

### J.1 Debug raw chat messages, fix-messages utilities

#### Purpose
Repair messages whose `chatId` was `NULL` after an early schema change.

#### User Role
Admin only. The endpoints are guarded by `JwtAuthGuard` + `RolesGuard` with `@Roles(UserRole.ADMIN)` and are hidden from the public Swagger document via `@ApiExcludeEndpoint()`.

#### Backend/API Interaction
- `GET /chats/admin/debug-messages/:chatId`
- `POST /chats/admin/fix-messages`
- `GET /chats/admin/fix-messages/sql`
- `POST /chats/admin/messages/:chatId/direct`

See [chats.controller.ts:73-249](../../backend/src/chats/chats.controller.ts#L73-L249) for implementation details.

#### Status
Implemented and locked down to administrators. Not part of the public API surface.
