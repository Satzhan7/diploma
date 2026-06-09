# Diploma Defense Brief — AdPartners.kz

**One-page brief. Reflects the code as it actually exists (not the thesis claims). Read with [AUDIT.md](AUDIT.md).**

**Problem.** Influencer marketing in Kazakhstan/CIS runs on Instagram DMs and spreadsheets: manual discovery, informal agreements that can't be audited, no professional channel for creators, and no localised platform. Global tools (AspireIQ, Upfluence) ignore the market and price for enterprises.

**Solution.** AdPartners.kz — a full-stack B2B2C web platform where brands and influencers register by role, brands post orders/campaigns, influencers apply, both sides manage collaborations and chat in real time, with a statistics dashboard. Validated with 30 practitioners (85% found it easier than their current workflow).

**Architecture.** Classic three-tier:
- **Frontend:** React 18 SPA (Create React App) + Chakra UI + React Router + axios + react-query + socket.io-client.
- **Backend:** NestJS 10, modular by domain (Auth, Users, Profiles, Orders, Matching, Collaborations, Chats, Statistics, Categories), TypeORM over PostgreSQL 14, Passport-JWT, socket.io gateway, Swagger at `/docs`.
- **Infra:** Docker Compose; production profile adds nginx reverse proxy + Let's Encrypt.

**Technologies.** TypeScript end-to-end, NestJS, TypeORM, PostgreSQL, JWT (dual-token), WebSocket, Docker, nginx.

**Key features (implemented & verified):**
1. Auth + RBAC — register/login, bcrypt-hashed passwords, three roles, guarded routes.
2. Dual-token JWT with refresh-token rotation (backend stores hashed refresh token; frontend single-flight 401 refresh + request replay).
3. Orders/campaigns + applications lifecycle.
4. Collaborations workflow.
5. Real-time chat over WebSocket with JWT-validated handshake; messages persisted.
6. Statistics dashboard.
7. Containerised stack via Docker Compose.

**Honest scope (NOT implemented — say so first if asked):** MinIO object storage / media uploads / `UploadsModule` and Gemini AI matching are **described in the report but not in the code**. Treat both as Future Work. (`brands/`, `influencers/`, `messages/` modules exist but are unwired dead code.)

**Demo flow (use the dev path).**
1. `docker compose up --build` → starts Postgres + backend (`:3005`, Swagger `/docs`).
2. `cd frontend && npm install && npm start` → UI on `:3000`. *(Dev compose has no frontend service — see AUDIT F4.)*
3. Register a brand and an influencer → login.
4. Brand creates an order/campaign → influencer browses and applies.
5. Brand reviews application → collaboration.
6. Open chat between the two accounts → send a live message (WebSocket).
7. Show the statistics dashboard + Swagger API.

**Business value.** First Kazakhstan-focused, role-based, auditable platform replacing DMs + spreadsheets; in-platform messaging and structured collaboration records; validated demand (85% of 30 users).

**Future improvements.** Influencer search from brand dashboard; payment integration (Kaspi); AI matching (Gemini); MinIO media uploads; notifications; analytics; mobile/PWA.

**Before defense — must do:** fix the three prod-config breakers (DB env names, frontend API var, prod schema) and align the thesis/MinIO claim. See [FIX_PLAN.md](FIX_PLAN.md). The **dev demo works today**; production deploy currently does not.
