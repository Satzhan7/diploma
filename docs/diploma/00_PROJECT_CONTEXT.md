# 00 — Project Context

This document is the source-of-truth context for the AdPartners.kz bachelor diploma project. It consolidates project metadata, the academic frame, the technology choices confirmed in the source code, and the goals of the documentation set produced under `docs/diploma/`.

## Project identification

| Field | Value |
|---|---|
| Product name | AdPartners.kz |
| Project title | Web platform connecting brands with local influencers in Kazakhstan and the CIS region |
| Team name | Innovators |
| Students | Kadir Satzhan, Abenov Aslan |
| Supervisor | Akhmetov Tolegen |
| Dean of Faculty | Ramis Akhmedov, Assistant Professor, Ph.D. |
| University | SDU University |
| Faculty | Faculty of Engineering and Natural Sciences |
| Programme code | 6B06102 — "Computer Science" |
| Defense year | 2025 |
| City | Kaskelen, Kazakhstan |

## Project summary

AdPartners.kz is a web platform that connects local brands with mid-tier and micro-influencers in Kazakhstan and the wider Commonwealth of Independent States (CIS) market. The platform addresses three structural inefficiencies in the regional influencer-marketing ecosystem: opaque influencer discovery, informal communication channels, and the absence of standardized performance reporting. By bringing discovery, negotiation, contractual collaboration, and analytics into a single product, the platform enables both sides to operate at scale and enables the regional digital-marketing ecosystem to professionalize.

## Problem statement

In Kazakhstan and the broader CIS region, influencer marketing has expanded rapidly, but it remains fragmented. Brands rely on word-of-mouth and direct messaging to identify influencers; mid-tier and micro-influencers struggle to surface their work; both sides lack tools to negotiate, formalize, and measure cooperation. International platforms such as Upfluence, AspireIQ, Influencity, Grin, and Traackr exist but are oriented toward enterprise customers, are priced out of the regional market, and do not localize for Kazakh and Russian content categories.

## Target market

- Geography: Kazakhstan (primary), Uzbekistan, Kyrgyzstan, and other CIS countries (secondary).
- Content categories: lifestyle, fashion, beauty, technology, food, travel, fitness — derived from the categories supported in `Profile.categories` and `User.categories`.
- Languages: English, Russian, Kazakh.

## Target users

The platform implements three user roles, defined in `backend/src/users/entities/user.entity.ts:17-21`:

| Role | Description | Implementation status |
|---|---|---|
| Brand | Companies that publish marketing campaigns ("orders") and recruit influencers. | Implemented |
| Influencer | Content creators who apply to orders and execute paid collaborations. | Implemented |
| Admin | Platform administrator. | Future improvement — the role is defined in the `UserRole` enum and is referenced by some `@Roles(UserRole.ADMIN)` decorators in the collaborations module, but no admin UI or admin-only routes exist. |

## Main value proposition

For brands: a localized search and recommendation interface that surfaces relevant influencers, a structured order/application workflow that replaces ad-hoc messaging, and post-campaign analytics that turn collaboration outcomes into measurable performance.

For influencers: visibility through a recommendation engine, a single inbox for incoming opportunities, and statistics on the campaigns they have completed.

For both: real-time chat, a status-tracked collaboration object, and a professional layer around what is otherwise informal labour.

## Technology stack

Confirmed from `backend/package.json`, `frontend/package.json`, `backend/src/app.module.ts`, and `docker-compose.yml`.

| Layer | Technology |
|---|---|
| Backend framework | NestJS 10 (TypeScript) |
| Database | PostgreSQL 14 (Alpine container) |
| ORM | TypeORM 0.3 |
| Authentication | JSON Web Tokens (Passport JWT strategy), bcrypt for hashing |
| Real-time messaging | Socket.io 4.7 (WebSocket gateway under namespace `/chats`) |
| API documentation | Swagger / OpenAPI (`@nestjs/swagger`) — served at `/docs` |
| Validation | `class-validator` + `class-transformer` |
| Frontend framework | React 18 + TypeScript |
| Frontend routing | React Router DOM 6 |
| UI library | Chakra UI 2 (with Emotion CSS-in-JS) |
| HTTP client | Axios |
| Server-state cache | TanStack React Query 5 |
| Form handling | React Hook Form |
| Charts | Recharts |
| Real-time client | socket.io-client 4 |
| Containerization | Docker, docker-compose |

## Main modules and features (confirmed from source)

### Backend modules (`backend/src/*`)

| Module | Purpose | Status |
|---|---|---|
| `auth` | Registration, login, JWT issuance and refresh, account deletion. | Implemented |
| `users` | User CRUD, influencer/brand directories. | Implemented |
| `profiles` | Brand and influencer profile management, social-media links, role-gated counterpart search. | Implemented |
| `brands` | Standalone Brand CRUD (parallel to the User+Profile flow). | Implemented but parallel; needs confirmation. |
| `influencers` | Reserved module shell. | Future improvement. |
| `orders` | Campaign creation by brands, listing for influencers, application workflow with status transitions. | Implemented |
| `collaborations` | Long-running brand–influencer collaborations linked to orders. | Implemented |
| `matching` | Match lifecycle, recommendation engine, match-score calculation. | Implemented (with one placeholder factor — see Technical Documentation). |
| `chats` | REST chat creation and message access plus a Socket.io gateway for real-time delivery. | Implemented |
| `messages` | Parallel message CRUD over the same database table. | Implemented but redundant; needs confirmation. |
| `statistics` | Brand and influencer analytics aggregated from match data. | Partially implemented — totals and campaign distribution are returned; daily aggregation is a future improvement. |

### Frontend pages (`frontend/src/pages/*`)

Twenty-six page components confirmed (see `11_REPOSITORY_ANALYSIS_REPORT.md` §5). Sample paths: `Landing`, `Login`, `Register`, `BrandDashboard`, `InfluencerDashboard`, `BrandOrders`, `CreateOrder`, `InfluencerList`, `Orders` (influencer), `OrderDetail`, `MyApplications`, `BrandList`, `BrandRecommendations`, `Messages`, `Matches`, `MatchDetail`, `Profile`, `EditProfile`, `Settings`.

## Confirmed information from source code

The list below summarizes claims that are anchored to specific files in the repository and can be re-verified at any time.

- The application is a single repository containing both backend and frontend (`/backend`, `/frontend`).
- It is deployable through `docker-compose up`. The compose file builds a PostgreSQL container and a NestJS container; the frontend is run separately in development with `npm start` from `frontend/`.
- The default backend port is `3005` (overridden in compose; default in code is `3000`).
- TypeORM auto-synchronization is enabled for non-production environments (`backend/src/config/configuration.ts:9`).
- JWT access tokens expire after 15 minutes and refresh tokens after 7 days (`backend/src/auth/auth.service.ts:95-105`).
- The Match recommendation engine excludes existing matches and ranks counterparts by category overlap (`backend/src/matching/matching.service.ts:177-244`).
- Real-time chat is delivered via a Socket.io gateway authenticated on connection by a JWT token in `handshake.auth.token` (`backend/src/chats/chats.gateway.ts:36-70`).

## Information from existing documentation (Innovators diploma PDF)

Sourced from `~/Desktop/Diplomaa docs/Innovators diploma1.pdf`:

- Abstracts in English, Kazakh (Аңдатпа), and Russian (Аннотация).
- Project objectives (Maximize Influencer Discoveries, Improve Communication, Provide Performance Analytics, Enable Scalable Campaign Management, Encourage Professionalization, Promote Regional Digital-Marketing Growth).
- Competitor list: Upfluence, AspireIQ, Influencity, Grin, Traackr.
- Citations: De Veirman et al. 2017; Brown & Hayes 2008; Influencer Marketing Hub 2023; Yessimova & Tulegenov 2021; Abdikarimova 2020; Kantar 2022.

## Open items for the team

The items below are non-blocking for the demo: they are inputs the team should supply (or actively decide to omit) before the final printed thesis.

| Item | Why |
|---|---|
| Team-role split | Chapter 1.3 of the thesis ("Team Roles and Responsibilities") describes how frontend, backend, design, and documentation duties are allocated between Kadir Satzhan and Abenov Aslan. The split is a personal record and is not derivable from the code. |
| Production deployment | The project currently runs locally via `docker-compose up`. No production hosting target is documented; the team should either deploy the application before the defense or note that the demo is local. |
| Legacy modules | The standalone `Brand` entity remains as legacy code. The abandoned root-level `src/` prototype, the empty `influencers/` module shell, the parallel `messages/` module, and the orphaned `frontend/src/mocks/` directory have all been removed during the demo-stabilisation pass. |

## Final documentation goal

The 12 markdown documents under `docs/diploma/` together form the deliverable that:

1. Describes the project formally (PRD, technical documentation, function-by-function reference).
2. Mirrors the source code accurately enough that the supervisor and defense committee can verify every claim against the repository.
3. Is structured so that its content slots directly into the SDU 2025 LaTeX bachelor-thesis template (`~/Desktop/SDU IS and CS Bachelor Thesis Template 2025 - Latex (Unzipped Files)/`) without restructuring during conversion.
4. Identifies, in plain language, what is implemented, what is partially implemented, and what is a future improvement, so the diploma defense reflects the codebase truthfully.
