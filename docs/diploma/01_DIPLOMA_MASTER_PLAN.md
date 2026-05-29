# 01 — Diploma Master Plan

This is the meta-plan over all 12 markdown files in `docs/diploma/` and the project as a whole. It identifies the current status, the materials available, what should be kept from the existing diploma, what should be rewritten, what should be added, and the priority of each remaining task.

## 1. Current project status

| Area | Status |
|---|---|
| Codebase | Working backend (NestJS + PostgreSQL) and frontend (React + Chakra UI) with the core feature set documented in `02_PRODUCT_REQUIREMENTS_DOCUMENT.md`. |
| Existing diploma document | `Innovators diploma1.pdf` (58 pages) — well written for Chapters 1–2, partial for Chapter 3, weak for Chapter 4 and Appendices. |
| Documentation set | `docs/diploma/` — produced in this revision with 12 files anchored to the source code. |
| LaTeX template | SDU 2025 template located and inspected (`~/Desktop/SDU IS and CS Bachelor Thesis Template 2025 - Latex (Unzipped Files)/`). Template values still hold the placeholder degree (Information Systems / 6B070300) — must be overridden. |
| Tests | Boilerplate only. Manual test cases are documented in `07_TESTING_DOCUMENTATION.md`. |
| Deployment | Local via `docker-compose up`. No production deployment confirmed. |

## 2. Available materials

| Material | Path | Coverage |
|---|---|---|
| Source code | `/Users/damiraliyev/Desktop/diploma-main` | Full read access. |
| Existing diploma PDF | `~/Desktop/Diplomaa docs/Innovators diploma1.pdf` | 58 pages; covers Chapters 1–4 + Appendices A and B. |
| Diploma figures | `~/Desktop/Diplomaa docs/Diploma images/` | Source images (UI prototypes, etc.). |
| SDU LaTeX template | `~/Desktop/SDU IS and CS Bachelor Thesis Template 2025 - Latex (Unzipped Files)/` | Document class, geometry, biblatex, sample chapters. |

## 3. Keep / Rewrite / Remove / Add

| Existing PDF section | Verdict | Reason |
|---|---|---|
| Title pages | Rewrite | The existing wording matches AdPartners.kz, but the LaTeX template's title pages must be re-typeset using SDU's required structure (see `09_LATEX_CONVERSION_PLAN.md §2`). |
| Abstract / Аңдатпа / Аннотация | Keep with light editing | Already drafted in three languages; review for grammar and academic tone before submission. |
| Chapter 1 — Introduction (problem, objectives, outline) | Keep | Well structured and substantively accurate. Add Section 1.3 "Team Roles and Responsibilities" — currently missing. |
| Chapter 2 — Literature Review and Market Analysis | Keep | Competitor analysis (Upfluence, AspireIQ, Influencity, Grin, Traackr) and citations are valid. Decide whether Section 2.5 "Survey and User Research" is needed; remove if no survey was performed. |
| Chapter 3 — Methodology and Design (Agile, design, frontend / backend / database / JWT) | Rewrite | Update with: (a) the actual NestJS module breakdown from `04_TECHNICAL_DOCUMENTATION.md`; (b) the entity model from `05_DATABASE_DOCUMENTATION.md`; (c) the matching algorithm, recommendation engine, and chat gateway descriptions from `03_FUNCTION_BY_FUNCTION_DOCUMENTATION.md`; (d) the role-based access map from `04_TECHNICAL_DOCUMENTATION.md §5`. |
| Chapter 4 — Results and Discussion | Rewrite | Replace the previous results narrative with the testing methodology, selected functional test cases, and updated screenshots (see `07_TESTING_DOCUMENTATION.md`). |
| Conclusion | Keep with edits | Tighten and add a forward-looking paragraph that lists the items marked `Future improvement` in `02_PRODUCT_REQUIREMENTS_DOCUMENT.md §14`. |
| Acronyms list | Add | Use the table in `08_FINAL_THESIS_STRUCTURE.md §7`. |
| References | Rewrite | Migrate to BibTeX (numeric biblatex). Use the entries in `09_LATEX_CONVERSION_PLAN.md §7`. |
| Appendix A — UML, sitemap, daily stand-up, test cases, execution plan, low-fidelity design | Keep + Add | Keep the existing UML and sitemap; replace the test-case list with the full table from `07_TESTING_DOCUMENTATION.md §3`. |
| Appendix B — Project structure (Models, ViewModels, Extensions, Services) | Rewrite | Replace with the corrected NestJS / React structure from `04_TECHNICAL_DOCUMENTATION.md §12` and the API summary from `06_API_DOCUMENTATION.md`. |

## 4. What must be generated from the source code

These items are not in the existing PDF and must be authored from the codebase:

| Item | Source markdown |
|---|---|
| Function-by-function reference | `03_FUNCTION_BY_FUNCTION_DOCUMENTATION.md` |
| Database documentation (entity-by-entity, with field-level types and FKs) | `05_DATABASE_DOCUMENTATION.md` |
| API documentation (every controller route, role, request body, response shape) | `06_API_DOCUMENTATION.md` |
| Technical architecture documentation with Mermaid diagrams | `04_TECHNICAL_DOCUMENTATION.md` |
| Testing documentation (50+ functional test cases) | `07_TESTING_DOCUMENTATION.md` |
| Repository analysis report (audit of what exists, what is partial, what is future improvement) | `11_REPOSITORY_ANALYSIS_REPORT.md` |

## 5. Final thesis section mapping (cross-reference)

| Thesis chapter | LaTeX file | Source markdown |
|---|---|---|
| Title pages | `titlepage1.tex`, `titlepage2.tex` | `00_PROJECT_CONTEXT.md` §1, `09_LATEX_CONVERSION_PLAN.md` §2 |
| Abstract / Аңдатпа / Аннотация | `abstract_*.tex` | Existing PDF pages 3–5 |
| Chapter 1 — Introduction | `introduction.tex` | `08_FINAL_THESIS_STRUCTURE.md` §2; existing PDF Chapter 1 |
| Chapter 2 — Literature Review | `chapterA.tex` | `08_FINAL_THESIS_STRUCTURE.md` §3; existing PDF Chapter 2 |
| Chapter 3 — Design and Methodology (incl. Implementation) | `chapterB.tex` | `08_FINAL_THESIS_STRUCTURE.md` §4 + `04_TECHNICAL_DOCUMENTATION.md` + `05_DATABASE_DOCUMENTATION.md` + `06_API_DOCUMENTATION.md` + `03_FUNCTION_BY_FUNCTION_DOCUMENTATION.md` |
| Chapter 4 — Results and Discussion | `chapterC.tex` | `08_FINAL_THESIS_STRUCTURE.md` §5 + `07_TESTING_DOCUMENTATION.md` |
| Conclusion | `conclusion.tex` | `08_FINAL_THESIS_STRUCTURE.md` §6 |
| Acronyms | (insert before References) | `08_FINAL_THESIS_STRUCTURE.md` §7 |
| References | biblatex | `09_LATEX_CONVERSION_PLAN.md` §7 |
| Appendix A | `appendixA.tex` | `08_FINAL_THESIS_STRUCTURE.md` §9 |
| Appendix B | `appendixB.tex` | `08_FINAL_THESIS_STRUCTURE.md` §10 |

## 6. Inputs required from the team

| Item | Required for | Owner |
|---|---|---|
| Team-role split (one short paragraph) | Section 1.3 | Kadir Satzhan + Abenov Aslan |
| Decision on Section 2.5 (omit, or write a short note that no survey was conducted) | Chapter 2 | Team |
| Screenshots: Landing, Brand dashboard, Influencer dashboard, Match list, Chat, Order list, Profile | Chapter 3 §3.5, Chapter 4 §4.3 | Team (capture from running app) |
| PNG renders of the Mermaid diagrams (system architecture, ER, auth sequence, state machines, messaging sequence, role-access map, deployment topology) | Chapter 3 | Documentation (use `mmdc`) |
| LaTeX project initialised with AdPartners.kz title-page values | Front matter | Documentation |
| BibTeX entries pasted into `bibliography.bib` | References | Documentation (entries supplied in [09_LATEX_CONVERSION_PLAN.md §7](./09_LATEX_CONVERSION_PLAN.md)) |
| Conclusion paragraph naming the supervisor and team | Conclusion | Team |
| Polished abstracts (EN/KZ/RU) | Front matter | Team | Drafts present in PDF; minor polish recommended |

## 7. Priority tasks

### P0 — Must complete before submission

| Priority | Task | Notes |
|---|---|---|
| P0 | Replace the LaTeX template's degree placeholder values with `Bachelor in Computer Science` / `6B06102`. | `09_LATEX_CONVERSION_PLAN.md §2`. |
| P0 | Insert AdPartners.kz title-page values into `titlepage1.tex` and `titlepage2.tex`. | `09_LATEX_CONVERSION_PLAN.md §2`. |
| P0 | Paste the three abstracts into `abstract_*.tex`. | Existing PDF pages 3–5. |
| P0 | Convert markdown chapter content (`08_FINAL_THESIS_STRUCTURE.md` mapping) into the four `.tex` chapter files. | One pass per chapter. |
| P0 | Add citations and convert references to BibTeX. | `09_LATEX_CONVERSION_PLAN.md §7`. |
| P0 | Render the Mermaid diagrams in `04_TECHNICAL_DOCUMENTATION.md` to PNG and place them in `figures/`. | `09_LATEX_CONVERSION_PLAN.md §5`. |
| P0 | Capture deployment screenshots and place them in `figures/`. | Required for Chapter 4 §4.3. |
| P0 | Run the manual test cases in `07_TESTING_DOCUMENTATION.md §3` and fill in the "Actual Result" column for the diploma defense. | At least the P0 cases (TC-001 to TC-019, TC-024, TC-027, TC-029, TC-034, TC-036, TC-037, TC-039, TC-041, TC-046). |
| P0 | Verify every "input required from the team" item in §6 has been supplied. | `grep -rn "input required from the team" docs/diploma/`. |

### P1 — Should complete before submission

| Priority | Task | Notes |
|---|---|---|
| P1 | Decide and document the team-role split. | Section 1.3 of the thesis. |
| P1 | Decide whether to keep or remove the existing PDF's daily stand-up appendix and the older test-case list. | Appendix A. |
| P1 | Replace the standalone `Brand` and `messages` modules' status with a clear "kept as legacy / consolidated" decision. | Documented in `11_REPOSITORY_ANALYSIS_REPORT.md`. |
| P1 | (Done) Maintenance endpoints moved under `/chats/admin/...`, locked to `@Roles(UserRole.ADMIN)`, hidden from Swagger via `@ApiExcludeEndpoint()`. |
| P1 | Override the default `JWT_SECRET` and CORS allow-all before any production rollout. | Same. |

### P2 — Nice to have

| Priority | Task |
|---|---|
| P2 | Implement automatic refresh-token rotation on the frontend. |
| P2 | Implement daily stat aggregation in `StatisticsService`. |
| P2 | (Done) `audienceMatch` is now deterministic — Jaccard of `Profile.languages` + `Profile.contentTypes`. |
| P2 | Add Jest unit tests for `MatchingService.calculateMatchScore` and `AuthService`. |
| P2 | Add Playwright E2E tests for the brand and influencer happy-path flows. |
| P2 | Migrate from `synchronize: true` to versioned migrations in production. |

## 8. Final deliverables

| Artefact | Format | Location |
|---|---|---|
| Bachelor thesis | PDF | Output of `pdflatex main` after applying the conversion plan. |
| Live demo | URL or screen recording | Local-only via `docker-compose up`; production hosting is a future deliverable. |
| Source code | Git repository | `/Users/damiraliyev/Desktop/diploma-main`. |
| Documentation set | Markdown | `docs/diploma/` (this folder). |
| Defense slides | PDF or Keynote | `Future improvement` — to be authored from the documentation set. |
| Test results | Filled-in `07_TESTING_DOCUMENTATION.md` | Updated by the team during pre-defense testing. |

## 9. Timeline (suggested)

| Week | Tasks |
|---|---|
| Week 1 | Resolve P0 missing materials (team-role split, screenshots, diagram exports). Start LaTeX migration with title pages, abstracts, and Chapter 1. |
| Week 2 | Migrate Chapter 2 (light edit) and Chapter 3 (deep rewrite using `04_TECHNICAL_DOCUMENTATION.md`, `05_DATABASE_DOCUMENTATION.md`, `06_API_DOCUMENTATION.md`). |
| Week 3 | Migrate Chapter 4 + Appendices. Fill in test results. Complete BibTeX entries. |
| Week 4 | Final review pass: typography, figure quality, citation completeness, every team-input item from §6 supplied. Compile final PDF. Practice defense. |

## 10. Sign-off checklist (before submission)

- [ ] All 12 markdown files in `docs/diploma/` reviewed and accurate.
- [ ] LaTeX `main.pdf` compiles cleanly with no warnings about undefined references or missing citations.
- [ ] Every team-input item from §6 supplied.
- [ ] All P0 tasks complete.
- [ ] Live demo accessible (or screen recording prepared).
- [ ] Final PDF reviewed by Akhmetov Tolegen (supervisor).
