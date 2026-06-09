# Documentation Audit

Every markdown file in the repo, its purpose, and a recommendation. Goal: a clean repo suitable for portfolio + defense. **Conservative** — delete only with clear cause. No files deleted by this audit; this is a plan.

## Inventory

| File | Purpose | Status | Recommendation |
|---|---|---|---|
| `README.md` (181 ln) | Top-level project intro/run instructions | Required | **Keep** — verify run commands match reality (dev compose has no frontend; see AUDIT F4). |
| `DEPLOY.md` (80 ln) | Production deployment steps | Useful/Required | **Keep** — update env var names + certbot bootstrap after fixes. |
| `REVIEW_FIXES_AND_REFLECTION.md` (86 ln) | Past AI review/reflection notes | Redundant | **Archive** — internal working note, not product doc. |
| `backend/README.md` (92 ln) | Backend run/info | Optional | **Keep if real**, else trim to run/build/test + Swagger URL. |
| `frontend/README.md` (0 ln) | — | Unfinished | **Fill or delete** (empty file looks abandoned). |
| `backend/src/scripts/README.md` (57 ln) | Explains ad-hoc fix scripts | Tied to dead scripts | **Archive** with the scripts (AUDIT F9/M3). |
| `backend/src/scripts/README-fix-chats.md` (47 ln) | One-off chat DB fix notes | Outdated/temporary | **Archive/Delete** — historical patch note. |
| `docs/diploma/00_PROJECT_CONTEXT.md` | Thesis context planning | Planning artifact | **Archive** — superseded by final thesis PDF. |
| `docs/diploma/01_DIPLOMA_MASTER_PLAN.md` | Thesis task plan | Planning artifact | **Archive**. |
| `docs/diploma/02_PRODUCT_REQUIREMENTS_DOCUMENT.md` | PRD | Useful but optional | **Keep one** as `docs/PRD.md` if you want a product doc; else archive. |
| `docs/diploma/03_FUNCTION_BY_FUNCTION_DOCUMENTATION.md` (1337 ln) | Exhaustive AI-generated function docs | Redundant/AI sprawl | **Archive** — too large, drifts from code, not maintained. |
| `docs/diploma/04_TECHNICAL_DOCUMENTATION.md` (449 ln) | Architecture/tech write-up | Overlaps AUDIT §1 | **Merge** key parts into `docs/ARCHITECTURE.md`, archive rest. |
| `docs/diploma/05_DATABASE_DOCUMENTATION.md` (300 ln) | DB schema docs | Useful | **Merge** into `docs/DATABASE.md` (verify against 9 live entities). |
| `docs/diploma/06_API_DOCUMENTATION.md` (248 ln) | API reference | Useful (Swagger is canonical) | **Keep as `docs/API.md`** or point to `/docs` Swagger; reconcile. |
| `docs/diploma/07_TESTING_DOCUMENTATION.md` (144 ln) | Test plan | Optional | **Archive** unless tests actually exist (only default specs found). |
| `docs/diploma/08_FINAL_THESIS_STRUCTURE.md` | Thesis outline | Planning artifact | **Archive**. |
| `docs/diploma/09_LATEX_CONVERSION_PLAN.md` | LaTeX conversion plan | Planning artifact | **Delete/Archive** — process scaffolding. |
| `docs/diploma/10_FINAL_PROJECT_CHECKLIST.md` | Checklist | Planning artifact | **Archive**. |
| `docs/diploma/11_REPOSITORY_ANALYSIS_REPORT.md` (255 ln) | Earlier AI repo analysis | Duplicate of this audit | **Archive** — superseded by `docs/AUDIT.md`. |
| `docs/AUDIT.md` | This audit | Required | **Keep**. |
| `docs/FIX_PLAN.md` | Remediation plan | Required (until fixes applied) | **Keep**, then archive after closure. |
| `docs/ENVIRONMENT_VARIABLES.md` | Env reference | Required | **Keep**. |
| `docs/DIPLOMA_DEFENSE_BRIEF.md` | 1-page defense brief | Required | **Keep**. |

## Cleanup Plan

### Keep (final repo)
`README.md`, `DEPLOY.md`, `backend/README.md`, `frontend/README.md` (filled), `docs/AUDIT.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/DIPLOMA_DEFENSE_BRIEF.md`, and the merged `docs/ARCHITECTURE.md` / `docs/DATABASE.md` / `docs/API.md`.

### Merge
- `04_TECHNICAL_DOCUMENTATION` → `docs/ARCHITECTURE.md`
- `05_DATABASE_DOCUMENTATION` → `docs/DATABASE.md`
- `06_API_DOCUMENTATION` → `docs/API.md` (cross-link Swagger `/docs`)
- `02_PRODUCT_REQUIREMENTS_DOCUMENT` → `docs/PRD.md` (optional)

### Archive (move to `docs/archive/`, keep history)
`REVIEW_FIXES_AND_REFLECTION.md`, `backend/src/scripts/README*.md`, `docs/diploma/00,01,03,07,08,10,11`, and FIX_PLAN after fixes land.

### Delete (safe, clear cause)
`docs/diploma/09_LATEX_CONVERSION_PLAN.md` (one-off process scaffold). Empty `frontend/README.md` if not filled. Optionally the whole `docs/diploma/` planning set once merged+archived.

### Recommended Final Documentation Structure
```
README.md                      # what it is, quickstart (corrected run command)
DEPLOY.md                      # production deploy (post-fix)
backend/README.md
frontend/README.md
docs/
├── ARCHITECTURE.md            # merged technical write-up + diagram
├── DATABASE.md                # schema (9 live entities)
├── API.md                     # endpoints + link to Swagger /docs
├── DIPLOMA_DEFENSE_BRIEF.md
├── AUDIT.md                   # this audit (or archive post-defense)
├── ENVIRONMENT_VARIABLES.md
└── archive/                   # superseded planning + reflection docs
```
