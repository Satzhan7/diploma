# Next-session prompts

Paste one prompt as the first message of a new Claude Code session. Order: (a) R4b, then (b) R5, which branches from R4b.

Both prompts copy the R4 QA kit from `/private/tmp/claude-501/-Users-damiraliyev-Desktop-diploma-main/efdee2ff-e3e2-4714-ba0f-58d58cae7b2b/scratchpad/qa/`. macOS clears `/private/tmp` on its own schedule; if the kit is gone, rebuild it from the "Browser QA" notes of PR R4 in tasks/todo.md and the harness rules in (b).

## (a) R4b — Design system

```
Create a design system for AdPartners.kz (the frontend in /Users/damiraliyev/Desktop/diploma-main/frontend): one set of sizes, proportions and layout rules, built from what we have now and current design standards. Then move the app onto it. I said the current site's size and proportions are wrong. This PR fixes that at the root, not page by page.

Branch: create redesign/4b-design-system from redesign/4-plan (PR #11, open). Open the PR against redesign/4-plan, marked "merge after #11". The local history is unrelated to GitHub's main, so PRs target the stack branches. R5 (deals) waits until this is merged, then builds on it.

Cost rule: this work is mostly reading and measuring. Keep the context lean: read files in parts, don't dump whole directories, and don't re-read files you have just edited. If the cost hook fires, stop and tell me. Do not continue until I say so.

## Read first
- docs/PROJECT.md: the whole file, especially section 3 "Current UI system" and the "Design system" section (7), which this PR fills in. It is the only design doc; do not create another one.
- tasks/lessons.md: all redesign sections (R1–R4). Note especially: the prettier command, `--no-deps`, QA selectors scoped to main/form/dialog, `gh` run from /tmp, first-load JS measurement, `w="fit-content"` vs overflow.
- tasks/todo.md: the redesign plan header and the PR R6 section (R6 is the a11y/mobile pass; this PR must not duplicate it, only give it the tokens).
- Memory: project-test-period-free.md, project-pr-base-branch-v1.md.
- First, add a lesson to tasks/lessons.md (new section "2026-10-06 — Design system"). Lesson: "Sizes and proportions were never a system. theme.ts set only colours, radii and fonts, so every page picked its own widths and font sizes and the result looked off. Define type, spacing, control and container tokens before building screens, and ban raw px in pages."

## What we have now (verified 2026-10-05)
- Chakra UI v2 (`extendTheme`) with React, Vite 8, react-query and i18next (RU default, KZ, EN).
- frontend/src/theme.ts (200 lines) is a "Liquid Glass" (Apple HIG) style.
  - Colours are CSS variables `--ap-*` in index.css (light, dark, more contrast, reduced transparency), mapped to semantic tokens. Keep this colour system.
  - Radii are defined: sm 8, md 12, lg 16, xl 22, 2xl 26, 3xl 32.
  - Fonts: the system SF stack.
  - Missing: a type scale, line heights, a spacing scale, container widths, control heights, breakpoints and density. All of these fall back to Chakra defaults.
- Raw values are scattered per page:
  - Content widths (`maxW`): 880px on brand/Plan, brand/Applicants and influencer/Stats; 720px on influencer/Apply; container.md on Profile, Settings and EditProfile; 520px on Landing; 440px and 320px on Auth; 420px on admin/Brands; sm on EmptyState; lg on NotFound.
  - components/ui/PageHeader.tsx: h1 at 28px (mobile) / 34px (desktop), with mb={8}.
  - components/AppShell.tsx (347 lines):
    - A fixed glass sidebar of SIDEBAR_W with INSET, plus TOPBAR_H and TABBAR_H constants.
    - Nav items are minH 42px with font size sm. The topbar title is 17px; the tab bar labels are 11px.
    - Main content: ml = SIDEBAR_W + 2*INSET, px {base 4, md 8}.
  - The content is left-aligned and capped at 880px beside the sidebar, so at 1280px and above there is a big empty band on the right. Cards in Applicants have a fixed width and leave gaps. Admin Brands is a tall list of heavy rows.
- Shared components are in components/ui: BriefCard, CardSkeleton, CreatorCard, EmptyState, PageHeader, ScoreRing, SegmentedControl, StatCard, StatusBadge, StatusPill, Stepper, VerifiedBadge.
- Run `rg -n 'fontSize=|maxW=|minH=|\bw="[0-9]|h="[0-9]|px="[0-9]|[0-9]+px' frontend/src/pages frontend/src/components` to get the full inventory of raw values.

## Step 1 — Research the standards (from their sources)
You may use ONE general-purpose subagent for this research, to keep your own context small. Ask it for a compact table with links, not raw file dumps.

Collect the concrete numbers from these sources:
- GitHub Primer: github.com/primer/primitives (font sizes, line heights, spacing, control heights sm/md/lg, breakpoints, container widths).
- IBM Carbon: github.com/carbon-design-system/carbon, packages/layout and packages/type (2x grid, spacing tokens, the productive vs expressive type scale).
- Material 3: github.com/material-components/material-web tokens and m3.material.io (the type scale from display to label, the 4dp grid, 48dp targets, window size classes).
- Tailwind CSS: tailwindcss default theme (spacing on a 4px base, the font-size/line-height pairs, max-w-prose = 65ch, breakpoints sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536).
- Radix Themes (github.com/radix-ui/themes) and shadcn/ui (github.com/shadcn-ui/ui): the scales and component sizes of a modern SaaS app (inputs and buttons 36/40px, card padding 24px).
- Apple HIG: the iOS/macOS text styles (body 17pt iOS, 13pt macOS) and 44pt touch targets. Our look is "Liquid Glass", so treat Apple as the visual reference and the others as the proportion reference.
- WCAG 2.2: 1.4.4 resize text, 1.4.10 reflow at 320px, 1.4.12 text spacing, 2.5.8 target size (24px minimum).
- Readability: a line length of about 45–75 characters, body line height of 1.4–1.6, and headings at 1.1–1.3.

Then, for one admin dashboard or SaaS app with a sidebar (for example the Vercel dashboard, Linear or GitHub), note the sidebar width, content max width, page padding, the h1 and body sizes, and the gap between cards. Measure it in the browser only if that is cheap; otherwise use published numbers.

Write the findings as a comparison table under "Standards" in the "Design system" section of docs/PROJECT.md, with a source link on every row.

## Step 2 — Measure the current site
- The Docker stack: frontend http://localhost:3000, API :3005, Mailpit :8025. If it is not running, run `docker compose up -d` and wait for the backend to report "(healthy)" with an until-loop (the dev backend reruns npm ci, about 3 min).
- Use playwright-core with the system Chrome. The R4 QA kit is in /private/tmp/claude-501/-Users-damiraliyev-Desktop-diploma-main/efdee2ff-e3e2-4714-ba0f-58d58cae7b2b/scratchpad/qa/; copy it to your own scratchpad.
  - Create one brand, one creator and one admin with disposable qa-ds-* emails. Register, then set emailVerifiedAt and the admin role in SQL. Log in once per role; the login route allows 10 requests/min.
  - Seed tokens with a sessionStorage-guarded addInitScript.
- At 390, 768, 1280, 1440 and 1920 px, in light and dark, for these pages: Landing, Auth, brand Dashboard, Briefs, BriefWizard, Applicants (feed/compare/one-by-one), Plan, Deals, Messages, creator feed, Apply, Stats, Profile, Settings, admin Verifications and Brands.
  - Record computed values: the h1/h2/body/small font sizes and line heights, content width, the empty space left and right of the content, control heights (buttons, inputs, nav items, tab bar), card padding and gaps, and the smallest tap target.
  - Take full-page screenshots named by page, width and theme.
- Write a "Current state" table in the "Design system" section of docs/PROJECT.md: measured value, the standard range, and a verdict (ok / too small / too big / inconsistent). List the five worst problems with screenshots.

## Step 3 — Propose the system, then ask me
Write a "Proposal" subsection in the "Design system" section of docs/PROJECT.md:
- Type scale: about 7 steps (caption 12 / small 14 / body 16 / lead 18 / h3 20 / h2 24 / h1 30–32 / display 40+). Each step gets a line height, weight and letter spacing, plus a mobile adjustment. Body text must not go below 16px, and no UI text below 12px.
- Spacing: a 4px base (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80), and named layout spacing such as page padding, section gap, card padding and stack gaps.
- Layout:
  - Breakpoints.
  - Sidebar width.
  - Page containers: narrow (forms, ~640–720), default (~1040–1120) and wide (data, ~1280–1440). Say which page uses which.
  - Centred, or left-aligned with a max width? Decide, and justify it against Step 1.
  - Grid columns per breakpoint, and a card min/max width for auto-fill grids.
- Control sizes: sm 32 / md 40 / lg 48 (pick and justify). Nav item height, the 44px mobile touch target and icon sizes.
- Radii: keep the current values or simplify them, and make them consistent with control heights.
- Elevation and glass: when to use glass versus a solid surface.
- Density: one default, maybe a compact one for admin tables.
- A before/after table for each problem from Step 2.

Then use AskUserQuestion for the decisions that are mine:
- Base body size (16 vs 17 Apple-like).
- Containers: centred or left-aligned.
- Default content width.
- Whether to keep the Liquid Glass sidebar.
- Whether admin gets a compact density.
Show small ASCII previews in the options. Do not implement before I answer.

## Step 4 — Implement
1. theme.ts:
   - `fontSizes`, `lineHeights`, `letterSpacings`, `space` (keep Chakra's keys working and add semantic ones), `sizes` (containers, sidebar, control heights), `breakpoints`.
   - Text styles: display, h1, h2, h3, body, lead, small, caption, label.
   - Layer styles.
   - Component sizes and default sizes for Button, Input, Select, Textarea, NumberInput, Tabs, Badge, Modal, Menu, Tooltip.
   - Keep the `--ap-*` colour variables and the semantic colour tokens unchanged.
2. Layout primitives in components/ui:
   - `PageContainer` (size narrow/default/wide).
   - `Section`.
   - `PageHeader` rewritten to use the text styles.
   - A `ResponsiveGrid` (auto-fill with min card width) if Step 3 calls for one.
3. AppShell: move its constants onto the tokens (sidebar, topbar, tab bar, nav items, insets). Fix the empty band. Check that the mobile tab bar labels meet the minimum text size.
4. Migrate every page and every components/ui file to the tokens and primitives. No raw `px` font sizes or widths in pages. Raw values are allowed only inside theme.ts and the primitives, each with a short comment.
   - Add a guard: an eslint `no-restricted-syntax` rule, or a small Vitest test that greps pages/ for `fontSize="\d+px"` and `maxW="\d+px"`.
5. A dev-only page at /dev/design (lazy route, only when `import.meta.env.DEV`) that shows the type scale, spacing, containers, controls, cards and pills in light and dark. Exclude it from the production bundle and prove that with the build output.
6. Every new user-facing string goes in RU/KZ/EN; Russian is the default. Do not change any behaviour, API calls or copy, except where a layout change needs it.
7. Prettier on touched code only: `npx -y prettier@3 --single-quote --print-width 120`. Check `git diff -w --stat` for churn, and revert any unrelated reformatting.

## Step 5 — Verify
- Frontend: tsc, eslint (0 errors; the one pre-existing AuthContext warning is allowed), Vitest (28 tests at the start; update snapshots and tests only for intended changes), vite build. Measure first-load JS with qa/firstload.mjs: it was 807 292 bytes at 893fecc. The design system must not add more than a few KB.
- Backend is untouched; confirm that with `git diff --stat redesign/4-plan -- backend` (expect empty).
- Rebuild with `docker compose up -d --build --no-deps frontend`.
- Rerun the Step 2 measurements with the same script. Add an "After" column to the "Design system" tables in docs/PROJECT.md, with before/after screenshots for the worst five pages.
  - Every row must now sit inside the standard range, or be a documented choice.
  - No horizontal scroll at 320/390 px.
  - No text below 12px; tap targets at least 24px everywhere and 44px on mobile primary actions.
  - Line length of 75 characters or less in reading text.
  - No raw i18n keys and no console errors.
- Regression: run the R4 QA (qa-r4.mjs) once and keep it at 119/119. Fix the script only where it depended on old pixel positions. Run cleanup.sh first and wait 60 s, then run cleanup.sh again afterwards until everything is 0, Mailpit is empty and no upload files are left on disk.
- Look at the screenshots yourself (light and dark; 390, 1280 and 1920 px) and judge them like a design reviewer: proportions, rhythm, alignment, hierarchy, empty space. Fix what looks off before calling it done.

## Step 6 — Ship
- Run `git status --short` before each commit and commit explicit paths, with the Co-Authored-By line from the attribution reminder:
  1. tokens + primitives + AppShell
  2. page migration
  3. guard + /dev/design
  4. docs (docs/PROJECT.md: fill the "Design system" section and replace the "no type, spacing, container or control-size scale yet; next: R4b" note in section 3 with the shipped tokens; tasks/todo.md with a new "PR R4b — Design system" section in the R4 style: checklist, As built, Checks, Browser QA, Known; lessons.md)
- Write pr-r4b.md in the style of the R4 PR body: summary, the standards table (short), the before/after table, screenshots described, checks and QA counts, and what is left for R6.
- Push with `git push -u origin redesign/4b-design-system`, then open the PR from outside the repo:
  `cd /tmp && gh pr create -R Satzhan7/diploma --base redesign/4-plan --head redesign/4b-design-system --title "R4b: design system — type, spacing, layout and control tokens" --body-file <pr-r4b.md>`
- Poll CI with `cd /tmp && gh pr checks <n> -R Satzhan7/diploma` in a background until-loop. The Vercel project "diploma-dybt" fails on every PR since #9; ignore it. Fix any GitHub CI failure and push again.
- When CI is green, stop and report: the PR link, the five biggest before/after changes, and anything you chose that I should look at. Then remind me that R5 (deal proof, confirm/dispute, ratings, e2e) is next. Its prompt is (b) in tasks/NEXT.md; it already cuts from redesign/4b-design-system and uses the new primitives.

## Rules
- Russian is the default language, and every new string goes in RU/KZ/EN.
- Use `--no-deps` when rebuilding a single service.
- Scope QA selectors to `main`, `form` or a dialog.
- Do not ask to connect MCP connectors.
- Backend audit is a separate later session; do not start it here.
- Stop and tell me if the cost hook fires.
```

## (b) R5 — Deal proof, confirm or dispute, two-way ratings

```
Build R5 on a new branch redesign/5-deals in /Users/damiraliyev/Desktop/diploma-main, cut from redesign/4b-design-system (the R4b PR, stacked on #11). Open the R5 PR against redesign/4b-design-system, marked "merge after R4b". The local history is unrelated to GitHub's main, so PRs target the stack branches.

Read these first:
- tasks/lessons.md, all redesign sections (R1/R1b, R2, R3, R4, and the R4b "Design system" section).
- docs/PROJECT.md, especially the "Design system" section from R4b: every new screen uses its tokens and layout primitives (PageContainer, Section, PageHeader, text styles, control sizes). No raw px font sizes or widths in pages; the R4b guard enforces it.
- The "PR R5" section of tasks/todo.md, and the R4 "As built" and "Known" paragraphs (R5 reuses the R4 storage and audit log).
- docs/adr/0001-deal-pipeline.md and backend/src/deals (DealStatus already has ACTIVE, PROOF_SUBMITTED, COMPLETED, DISPUTED, CANCELLED).
- Memory: project-test-period-free.md and project-pr-base-branch-v1.md.

State at handoff (R4 is done; R4b must be merged-ready with green CI before you start. Its PR body and the "PR R4b" section of tasks/todo.md have newer check counts and first-load JS than the R4 numbers below; use those as the baseline):
- PR #11 (redesign/4-plan → redesign/3-briefs) is open. GitHub CI is green: backend and frontend jobs. Commits 937570f..893fecc, docs 6c85685.
  - The Vercel project "diploma-dybt" also fails on #9 and #10. It is outside this repo's CI; ignore it unless I ask.
- Checks at 893fecc:
  - Backend: tsc, eslint 0, prettier, Jest 28 suites / 216 tests, nest build.
  - Frontend: tsc, eslint 0 errors / 1 pre-existing warning (AuthContext), Vitest 7 files / 28 tests, vite build. First-load JS is 807 292 bytes (entry + modulepreload list in build/index.html).
- Browser QA qa-r4.mjs passed 119/119 at 893fecc, and its data was cleaned up (all 0, Mailpit empty, no upload files on disk).
- The backend is healthy, with FREE_TEST_PERIOD=true.
- The QA kit is in /private/tmp/claude-501/-Users-damiraliyev-Desktop-diploma-main/efdee2ff-e3e2-4714-ba0f-58d58cae7b2b/scratchpad/:
  - qa/qa-r4.mjs (playwright-core with the system Chrome), qa/cleanup.sh, qa/cleanup.sql, qa/firstload.mjs, qa/package.json, qa/node_modules, qa/shots/.
  - pr-r4.md is the R4 PR body; use it as the style for pr-r5.md.
  - cleanup.sh has a hard-coded path to cleanup.sql.
- QA harness rules learned in R4:
  - The login route is throttled at 10/min per IP. Log in once per role (loginAll), never inside a loop, and wait 60 s after cleanup before a run.
  - Each user has ONE stored refresh token, so a re-login invalidates the tokens held by open browser contexts. Seed tokens once per tab (sessionStorage guard in addInitScript), and push fresh tokens into live contexts after a re-login (pushTokens).
  - The dev backend reruns `npm ci` on every start (about 3 min). Poll GET /health after a restart, not an authed route.
  - If the backend gets stuck, restore it with `docker compose up -d --build --no-deps backend` and wait for "(healthy)" with an until-loop. If `npm ci` hangs, check `docker compose logs backend`, the npm cache, disk space and Docker memory first. Do not edit compose to skip `npm ci` without asking me.

What R5 is (see "PR R5" in todo.md):
1. Deal proof:
   - The creator submits a proof link plus an optional screenshot through the R4 StorageService. ACTIVE → PROOF_SUBMITTED.
   - Validate the link: https only, length cap, normalised. The screenshot uses the same magic-byte type check, metadata stripping and 5 MB limit as R4. Add a new file kind (e.g. `deal_proof`). Only the two deal parties and an admin can read it; everyone else gets 404, and anonymous gets 401.
   - Resubmitting while PROOF_SUBMITTED replaces the proof and removes the old file. Write the state change under a deal row lock (compare-and-set on the status), like the R4 approve.
2. Brand decision on PROOF_SUBMITTED:
   - Confirm Completion → COMPLETED.
   - Report a Problem (reason 3–500 chars) → DISPUTED.
   - Only the deal's brand can do either. Wrong state → 409 with a code. Add the new codes to the error-code list and to RU/KZ/EN.
   - Admin moderation list /admin/disputes in the R4 admin shell, built on the R4b primitives: deal, both parties, proof link and screenshot, the reason. The admin resolves a dispute to COMPLETED or back to ACTIVE with a note. Every admin action writes audit_log in the same transaction.
3. Two-way ratings after COMPLETED:
   - 1–5 plus an optional comment (cap the length), one per deal per side, enforced by a unique constraint (deal, rater).
   - A second rating → 409. Rating before COMPLETED → 409. A non-party → 404.
   - Averages and counts on profiles, computed on read or maintained in the same transaction. Pick one, justify it in todo.md, and make it race-safe.
   - Show ratings on the deal page and the rating summary where profiles are shown today. The full Creator profile redesign is R6, so keep this minimal.
4. Backend e2e test of a whole deal against a real Postgres:
   - register → verify email (read the code from the DB or a mail stub) → brief → publish → apply → accept → proof → confirm → both ratings → averages.
   - Add the negative paths that matter: a wrong role, a wrong state, a double rating.
   - Use backend/test/jest-e2e.json (`npm run test:e2e`). Run the migrations on a fresh DB, not `synchronize`.
   - CI: add a Postgres service container to the backend job in .github/workflows/ci.yml, plus the env it needs, and run test:e2e after the unit tests. Locally, run it against a scratch DB in the compose Postgres (port 5435) and drop the DB afterwards.

Steps:
1. Copy the QA kit and pr-r4.md into this session's scratchpad, fix the cleanup.sql path in cleanup.sh, and run it once (expect all 0).
2. Write the R5 implementation checklist into the "PR R5" section of tasks/todo.md, in the style of R4, before coding. Include any decision that needs me (e.g. whether a dispute can be resolved to CANCELLED), and ask me with AskUserQuestion only if it changes the design.
3. Backend: entities, migration (generate it on a scratch DB at PlanUploadsVerification, then prove the round trip: run → `--dr` no drift → revert → run → no drift), services, controllers, DTOs, specs for every rule above. Extend cleanup.sql for the new tables (ratings, proof files, deal audit rows).
4. Frontend:
   - Deal page:
     - Creator: proof form with field errors and an optional screenshot.
     - Brand: Confirm / Report a Problem dialog with a reason.
     - Status pills for every state.
     - Rating form after COMPLETED, and both ratings once given.
   - Admin disputes page.
   - Every new string goes in RU/KZ/EN; Russian is the default. Errors go through the existing code → message mapping.
5. Checks for both apps: backend tsc, eslint, prettier, Jest, nest build, test:e2e; frontend tsc, eslint, Vitest, vite build. Note the first-load JS. Rebuild with `docker compose up -d --build --no-deps backend frontend` and wait for healthy.
6. QA (new qa-r5.mjs, built on qa-r4.mjs helpers):
   - Brand + creator, through to a deal (API setup is fine).
   - The creator submits proof in the UI (link + screenshot).
   - The serving matrix for the proof screenshot.
   - Resubmit replaces the file.
   - Brand Confirm in the UI → COMPLETED.
   - Both ratings in the UI, the average shown, a second rating → 409.
   - A second deal: Report a Problem → DISPUTED → visible in /admin/disputes → admin resolves → audit_log row.
   - Wrong-role and wrong-state API checks.
   - KZ/EN, dark, 390 px for the deal page in each state and the disputes page. No horizontal scroll, raw keys or console errors. D5: no other user's email in responses.
   - Run: cleanup.sh, wait 60 s, then `node qa-r5.mjs > qa-r5.out`. Everything must PASS; if anything fails, fix the code or the test. Look at the screenshots.
   - Clean up until everything is 0, Mailpit is empty and no upload files are left on disk.
7. Security pass inline against redesign/4b-design-system (the security-review skill diffs against origin/HEAD, which shares no history). Check proof-file IDOR, link validation (no javascript:/data:), rating spoofing, state-machine bypass and mass assignment. Run one reviewer agent on the diff, then fix or record each finding.
8. Commits: run `git status --short` before each one and commit explicit paths, with the Co-Authored-By line from the attribution reminder. Code first, then todo.md (boxes, As built, Checks, Browser QA, Security review, Review, Known) and lessons.md (a new "Redesign R5" section) together.
9. Write pr-r5.md in the style of pr-r4.md. Push with `git push -u origin redesign/5-deals`. Open the PR from outside the repo (the gh build here fails through xcrun inside it):
   `cd /tmp && gh pr create -R Satzhan7/diploma --base redesign/4b-design-system --head redesign/5-deals --title "R5: deal proof, confirm or dispute, two-way ratings" --body-file <pr-r5.md>`
10. Poll CI with `cd /tmp && gh pr checks <n> -R Satzhan7/diploma` in a background until-loop (no chained sleeps). The e2e job must pass in CI; that is R5's "done when". Fix any failure and push again.
11. When CI is green, hand off to R6 (see "PR R6" in todo.md) with a prompt in the same style, and stop.

Rules:
- Russian is the default language, and every new string goes in RU/KZ/EN.
- Nobody is charged during the test period. R5 adds no payments.
- Run `git status --short` before each commit and commit explicit paths.
- Use `--no-deps` when rebuilding a single service.
- Scope QA selectors to `main`, `form` or a dialog.
- Prettier on touched frontend code only: `npx -y prettier@3 --single-quote --print-width 120`. Check `git diff -w --stat` for churn.
- Do not ask to connect MCP connectors.
- Stop and tell me if the cost hook fires.
```
