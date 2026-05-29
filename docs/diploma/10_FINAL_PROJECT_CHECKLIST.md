# 10 — Final Project Checklist

Action checklist for bringing AdPartners.kz to a defendable state. Items marked `[x]` were completed during the documentation pass; items marked `[ ]` are awaiting the team. Each section is grouped by area.

## 1. Documentation set (`docs/diploma/`)

- [x] Author `00_PROJECT_CONTEXT.md`.
- [x] Author `01_DIPLOMA_MASTER_PLAN.md`.
- [x] Author `02_PRODUCT_REQUIREMENTS_DOCUMENT.md`.
- [x] Author `03_FUNCTION_BY_FUNCTION_DOCUMENTATION.md`.
- [x] Author `04_TECHNICAL_DOCUMENTATION.md` with Mermaid diagrams.
- [x] Author `05_DATABASE_DOCUMENTATION.md`.
- [x] Author `06_API_DOCUMENTATION.md`.
- [x] Author `07_TESTING_DOCUMENTATION.md`.
- [x] Author `08_FINAL_THESIS_STRUCTURE.md`.
- [x] Author `09_LATEX_CONVERSION_PLAN.md`.
- [x] Author `10_FINAL_PROJECT_CHECKLIST.md` (this file).
- [x] Author `11_REPOSITORY_ANALYSIS_REPORT.md`.
- [ ] Final review pass for academic English consistency by a single editor across all 12 files.

## 2. Source-code hardening

- [x] Add `JwtAuthGuard` to the `/users` controller (previously open).
- [x] Add ownership checks to `/matching` (read, update, accept, reject, complete, stats) — caller must be a participant.
- [x] Lock down `/profiles` to `GET/PATCH /profiles/me`, role-restricted search, and read-only `GET /profiles/:userId`. Generic POST/PUT/DELETE endpoints removed.
- [x] Restrict the `/chats` admin-only maintenance endpoints to the `admin` role and hide them from Swagger.
- [x] Replace `Math.random()` in `MatchingService.calculateMatchScore` with deterministic Jaccard / engagement / follower factors.
- [x] Resolve the `/users/settings` mismatch by persisting Settings preferences to `localStorage` and removing the orphaned frontend service.
- [x] Fix the demo-flow endpoint mismatches between frontend services and backend controllers (chat creation path, mark-as-read verb, application withdrawal verb, `getMyApplications` route, `Profile.handleCreateChat` URL).
- [x] Consolidated the `messages` module into `chats` (legacy module deleted; `MatchingService` and `OrderApplicationsService` now use `ChatsService`).
- [x] Removed the legacy standalone `Brand` entity / `BrandsModule` (never registered in TypeORM `entities`; superseded by `User` + `Profile (type='brand')`).
- [x] Removed the empty `influencers/` module shell (was unused).
- [x] Removed the root-level `src/matching/` and `src/orders/` prototype (54 lines, abandoned).
- [x] Removed inactive frontend pages (`brand/Campaigns.tsx`, `brand/Messages.tsx`, `brand/Influencers.tsx`, `brand/InfluencerRecommendations.tsx`, `brand/MatchRecommendations.tsx`) and unused services (`services/brands.ts`, `services/influencers.ts`, `services/match.ts`, `services/mockData.ts`).
- [x] Removed placeholder "Stats Updated (Placeholder)" / "Complete & Update Stats (TBD)" actions from `frontend/src/pages/brand/Orders.tsx`.
- [x] Aligned the WebSocket fallback URL in `frontend/src/services/socket.ts` to `http://localhost:3005`.
- [ ] Override `JWT_SECRET` in production env (currently defaults to `super-secret`).
- [ ] Restrict CORS to the production frontend origin (currently `app.enableCors()` allows any origin).
- [ ] Disable `synchronize: true` outside development; adopt versioned migrations.
- [ ] Implement frontend refresh-token rotation (Future improvement FI-004).
- [ ] Wire the full three-factor match score into the recommendation listing endpoints (Future improvement FI-005).
- [ ] Implement daily stat aggregation in `StatisticsService` (Future improvement FI-006).
- [ ] Replace `Partial<Entity>` parameters in remaining controllers with explicit DTOs.

## 3. Code cleanup

- [ ] Run `npm run lint` in `backend/` and address all warnings.
- [ ] Run `npm run build` in both `backend/` and `frontend/` with no warnings.
- [ ] Verify `tsconfig.json` `strict` flag in both backend and frontend.
- [ ] Confirm no committed secrets, credentials, or local `.env` files.

## 4. Demo screenshots (for the thesis)

- [ ] Public landing page (`/`).
- [ ] Registration page (`/register`).
- [ ] Login page (`/login`).
- [ ] Brand dashboard (`/brand/dashboard`).
- [ ] Influencer dashboard (`/influencer/dashboard`).
- [ ] Brand orders list (`/brand/orders`).
- [ ] CreateOrder form (`/brand/orders/create`).
- [ ] InfluencerList (`/brand/influencers`).
- [ ] Matches list (`/brand/matches`).
- [ ] MatchDetail (`/brand/matches/:matchId`).
- [ ] Profile view (`/brand/profile`).
- [ ] EditProfile (`/brand/profile/edit`).
- [ ] Real-time chat (`/brand/messages`).
- [ ] MyApplications (`/influencer/applications`).
- [ ] OrderDetail with apply form (`/influencer/orders/:orderId`).
- [ ] BrandRecommendations (`/influencer/recommendations`).
- [ ] Settings page (`/brand/settings` or `/influencer/settings`).
- [ ] Swagger UI (`/docs`).

## 5. Diagrams (Mermaid → PNG)

Export the diagrams in [04_TECHNICAL_DOCUMENTATION.md](./04_TECHNICAL_DOCUMENTATION.md) using `npx -y @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o figures/<label>.png -t neutral -b transparent`.

- [ ] System architecture (`fig:system_architecture`).
- [ ] Authentication sequence (`fig:auth_sequence`).
- [ ] Role-based access map (`fig:role_access_map`).
- [ ] ER diagram (`fig:er_diagram`).
- [ ] Order state machine (`fig:order_state`).
- [ ] Order application state machine (`fig:application_state`).
- [ ] Match state machine (`fig:match_state`).
- [ ] Messaging sequence (`fig:messaging_sequence`).
- [ ] Module dependency graph.
- [ ] Brand user flow.
- [ ] Influencer user flow.
- [ ] Deployment topology.

## 6. Manual test pass

Execute the test cases in [07_TESTING_DOCUMENTATION.md §3](./07_TESTING_DOCUMENTATION.md) and fill in the *Actual Result* column. Demo-critical groups:

- [ ] TC-001 to TC-019 (registration, login, JWT, profile, orders).
- [ ] TC-024 to TC-029 (applications).
- [ ] TC-030 to TC-037 (matching).
- [ ] TC-038 to TC-042 (chat).
- [ ] TC-043 to TC-044 (statistics).
- [ ] TC-046 (account deletion) and TC-047 (logout).
- [ ] Document any deviation between expected and actual results.
- [ ] Add at least three Jest unit tests for `MatchingService.calculateMatchScore` (full overlap, no overlap, asymmetric language sets).

## 7. LaTeX migration

- [ ] Override `\def\mydegree`, `\def\mydegreecode`, `\def\myauthor`, `\def\mycoach`, `\def\mytitle` in `main.tex` with the AdPartners.kz values.
- [ ] Update `titlepage1.tex` with the AdPartners.kz cover values.
- [ ] Update `titlepage2.tex` with Dean (Ramis Akhmedov), Supervisor (Akhmetov Tolegen), and Students (Kadir Satzhan, Abenov Aslan).
- [ ] Paste the English abstract into `abstract_english.tex`.
- [ ] Paste the Kazakh abstract into `abstract_kazakh.tex`.
- [ ] Paste the Russian abstract into `abstract_russian.tex`.
- [ ] Author `introduction.tex` (Chapter 1).
- [ ] Author `chapterA.tex` (Chapter 2).
- [ ] Author `chapterB.tex` (Chapter 3 with sections 3.1–3.9).
- [ ] Author `chapterC.tex` (Chapter 4).
- [ ] Author `conclusion.tex`.
- [ ] Insert the acronyms section before References.
- [ ] Add the BibTeX entries from [09_LATEX_CONVERSION_PLAN.md §7](./09_LATEX_CONVERSION_PLAN.md) to `bibliography.bib`.
- [ ] Author `appendixA.tex` (UML, sitemap, full test cases).
- [ ] Author `appendixB.tex` (project structure).
- [ ] Place rendered figures in `figures/`.
- [ ] Compile via `latexmk -pdf -bibtex main.tex` (or `pdflatex / biber / pdflatex / pdflatex`).
- [ ] Verify the final PDF against [09_LATEX_CONVERSION_PLAN.md §12 Final PDF checklist](./09_LATEX_CONVERSION_PLAN.md).

## 8. Defense preparation

- [ ] Prepare 12-15 minute defense slides (problem, target market, system architecture, ER diagram, key flows, demo, results, future work).
- [ ] Prepare a live demo or screen-recorded demo.
- [ ] Prepare answers to likely committee questions: scaling strategy, security model, data privacy, monetisation, competitive moat.
- [ ] Rehearse the demo at least twice with the supervisor.
- [ ] Prepare printed copies according to faculty rules.
- [ ] Confirm submission deadline with the supervisor.

## 9. Submission

- [ ] Bound printed thesis copies per faculty rule.
- [ ] PDF version submitted to faculty system.
- [ ] Source code archived (zipped repository or GitHub access for the committee).
- [ ] Approval signatures on `titlepage2.tex`.
- [ ] Plagiarism / similarity report (per faculty rule).
- [ ] Defense slot scheduled.
- [ ] Public live demo URL or recorded video.

## 10. Pre-submission sanity scan

Run from the project root:

```bash
# Final-facing docs should be free of unresolved markers.
grep -rn "Needs confirmation" docs/diploma/

# No unintentional debug output left in the backend.
grep -rn "TODO" backend/src/

# Builds should compile without warnings.
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# LaTeX should compile cleanly.
latexmk -pdf -bibtex main.tex
```
