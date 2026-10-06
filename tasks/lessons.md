# Lessons

## 2026-06-10 — audit fix session

- **GateGuard hooks block the first Edit/Write per file and destructive Bash commands; an identical retry passes.** Don't rephrase the command on retry — resend it verbatim after stating the facts. Changing the command string resets the gate.
- **Never run `rm -rf src/` with a relative path when Bash cwd persists across calls** — cwd was `backend/`, which would have deleted backend/src. Use absolute paths or `git rm` (tracked-only + trivially reversible).
- **JwtStrategy.validate must return a minimal claims object.** Spreading a TypeORM entity (`{...user}`) strips class-transformer metadata, so `@Exclude` fields (password/refreshToken hashes) leak through serialization.
- **NestJS WebSocket gateway `this.server` is null outside the HTTP runtime** (createApplicationContext for seeds/tests). Any `server.emit` helper needs a null guard or service code paths throw mid-transaction-chain.
- **Old `jwa`/`buffer-equal-constant-time` deps crash on modern host Node (SlowBuffer removed).** Run scripts inside the Node 18 container (`docker compose exec backend npm run seed`) instead of fighting host Node.
- **TypeORM: assigning `where.createdAt` twice (MoreThanOrEqual then LessThanOrEqual) silently drops the first bound** — use `Between`. And `ILike` on a `text[]` column is a runtime SQL error — use `ArrayContains`.
- **`docker compose exec psql -tAc` with multiple statements returns only the last result** — combine into one SELECT with subqueries.

## 2026-10-01 — productization Phase 0

- **Check `git merge-base HEAD origin/main` before promising a PR.** Local `main` was re-rooted (`354b3c4`) and shares no history with GitHub `main`; GitHub refuses PRs between unrelated histories. PRs now target `v1`.
- **When a working tree mixes prettier reformatting with logic, normalise both sides first.** Commit prettier(HEAD) on its own, then restore the tree and re-run prettier, so each later commit shows logic only. Verify each commit in a scratch `git worktree` (typecheck at every commit).
- **The backend `npm run lint` script has `--fix`, so it rewrites files.** For checks use `npx eslint` without it (or `npm run lint:check`).
- **zsh: `echo =====` fails ("not found") because of `=` expansion.** Use `echo -----` as the separator.
- **Parallel Bash calls share one cwd.** Two calls that each `cd` raced and ran `npm audit fix`/`tsc` in the wrong directory. Run directory-sensitive commands sequentially, or use `npm --prefix`/absolute paths without `cd`.
- **bcrypt only reads 72 bytes; never bcrypt a JWT.** Every refresh token of a user shared the first 72 bytes, so rotation revoked nothing. Hash long random tokens with SHA-256 and compare with `timingSafeEqual`.
- **A class-level `@Throttle` covers every route in the controller.** `GET /auth/profile` (called on each page load) inherited the 10/min login limit. Put strict limits on the brute-force routes only.
- **A CSP `connect-src` must match every build's API origin.** Prod is same-origin https, dev calls `http://localhost:3005`; a static header broke dev login. Unit tests and builds pass anyway — only a real browser run catches it, so do browser QA before calling a frontend step done.


## 2026-10-03 — Phase 1

- **npm `overrides` with a relative `file:` spec resolves against the dependent package**, not the project root (`node_modules/jwa/vendor/...`, an empty entry). Declare the local package as a root dependency (`"x": "file:vendor/x"`) and override with `"x": "$x"`; check the lockfile has one `"link": true` entry before building.
- **Do i18n extraction inline, file by file; spawn at most one reviewer agent.** Four parallel extraction subagents stalled on the stream watchdog (~600 s) and had to be resumed; session cost went from ~$90 to ~$182. Two read-only Explore agents for code mapping were fine.
- **The Playwright MCP needs the "Playwright MCP Bridge" browser extension, which is not connected.** For browser QA use a playwright-core script in the scratchpad with `executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.
- **Claude Design `.dc.html` canvases need `support.js` beside them and an HTTP server (not `file://`).** Frames scroll internally, so full-page screenshots cut them off; read the inline `<script type="text/x-dc">` for tokens and sample data.
- **`ArrayContains` only works on real Postgres arrays.** `Profile.categories` is a TypeORM `simple-array` (comma-separated text); filter it with `Raw` + `string_to_array`. Check the column type before choosing the operator, and prove the query against real Postgres (mocked unit tests cannot catch it).
- **Nest builds with `declaration: true`, so `dist/` holds `.d.ts` files.** A migrations glob of `*{.ts,.js}` matches `x.d.ts` when run from dist. Load `.js` only from dist.
- **Chakra `Switch` / `Checkbox` submit an empty value when checked.** With `FormData`, test `formData.has(name)`, not `=== 'on'`.
- **A custom `@Catch()` filter replaces Nest's default handling for every error, not just HttpExceptions.** Nest's base filter keeps the status of `http-errors` (body-parser 413 / 400); ours turned them into 500. Any catch-all filter must pass through exposed 4xx `http-errors` (`expose === true`, `status` 400–499) and skip writing when `res.headersSent`. Prove it live with an oversized and a malformed body.
- **`git rm` stages the deletion immediately.** When splitting work into several commits, a later partial `git add` + `git commit` also commits that deletion. Run `git status --short` before each commit of a split and check that only the intended paths are staged.

## 2026-10-04 — Redesign R1 / R1b

- **Chakra `useRadio`: `getRadioProps()` marks the visual box `aria-hidden`, so text inside it does not name the radio.** Name the input with `getInputProps({ 'aria-labelledby': titleId })`, and pass `aria-describedby` to `useRadio(...)` itself — `getInputProps` overwrites an `aria-describedby` given to it. Check names in Chrome's accessibility tree (`locator.ariaSnapshot()`), not only visually.
- **The frontend has no prettier dependency.** `npx prettier` downloads one with defaults (double quotes, 80 columns) and rewrites whole files. Use `npx -y prettier@3 --single-quote --print-width 120` and check `git diff -w --stat` for churn.
- **Browser QA: never assert "gone" right after `waitForURL`.** The URL changes before React re-renders. Wait for `state: 'detached'` with a timeout.
- **Vite 8 (Rolldown) can merge an eagerly-preloaded shared chunk into the entry.** A bigger `index-*.js` is not a regression by itself; compare the total first-load JS (entry + `modulepreload` list in `build/index.html`) before and after.
- **Use one-pass substitution for email templates** (`/\{(name|code)\}/g`). Replacing `{code}` after inserting a user-controlled name expands placeholders inside the name.
- **Email verification with a password chosen at sign-up invites pre-registration hijack.** An attacker registers the victim's address; the victim later "signs up", gets the code, verifies — and the attacker's password still works. The person who proves the inbox must set the password (verify takes it), and verify errors must not distinguish pending accounts.

## 2026-10-04 — Redesign R2

- **`git rm` staged deletions slipped into an unrelated commit again.** Prefer plain `rm` and stage with `git add -A <paths>`, or commit with explicit paths (`git commit <paths>`); run `git status --short` right before each commit.
- **zsh does not word-split `$VAR`.** `E="A=1 B=2"; env $E cmd` passes one argument. Use `export A=1 B=2` (or an array) instead.
- **Never run `sed`/`cat`/`grep` on a possibly empty `$F`.** With no file argument they read stdin and the call hangs. Guard with `[ -n "$F" ]` or iterate `${(f)F}`.
- **The TypeORM generator does not drop tables of removed entities.** Add the `DROP TABLE` / `DROP TYPE` statements by hand, with a `down` that recreates them from the Baseline migration, and prove the round trip.
- **`@Column({ unique: true })` on a OneToOne join column duplicates the `REL_` unique constraint** TypeORM already creates. Leave `unique` off the join column of a OneToOne.
- **Removing a static route can expose a dynamic sibling.** After `GET /users/influencers` was deleted, the path fell through to `GET /users/:id` and Postgres answered the non-UUID with a 500. Every `:id` param that maps to a uuid column gets `ParseUUIDPipe`; probe removed paths after deleting routes.

## 2026-10-05 — Redesign R3

- **An `aria-label` must contain the visible text, ideally at the start.** The feed's "Apply" link carried `aria-label="Open brief {{title}}"`, which replaced its name: it failed WCAG 2.5.3 (label in name) and broke the QA locator `getByRole('link', { name: 'Apply' })`. Write labels as `"<visible text>: <context>"`, or drop the `aria-label`.
- **Changing a route mid-form remounts the component.** Navigating from `/brief/new` to `/brief/:id/edit` after the first draft save would reset the wizard's state and step. Keep the URL and hold the saved id in state.
- **`prettier --write` on a touched legacy file reformats all of it.** Check `git diff -w --stat` before committing; if unrelated lines changed, revert and format only the new code.
- **Postgres `FOR UPDATE` cannot lock the nullable side of an outer join.** TypeORM's `setLock('pessimistic_write')` on a query with `leftJoin` fails. Lock the bare row, then check ownership with the FK column.
- **Scope QA selectors to `main` or `form`.** The shell also has language buttons ("Русский", "RU"), so page-level `getByRole('button', { name })` hits two elements.
- **`w="fit-content"` defeats `overflowX="auto"`.** The element grows past its parent, so the page scrolls instead of the control. Add `maxW="full"` and `flexShrink={0}` on the children.
- **`docker compose up -d --build frontend` also recreates `backend`** (depends_on), which reinstalls for about a minute. Use `--no-deps`, or wait for `healthy` before running QA.
- **`waitForLoadState('networkidle')` after a client-side navigation returns at once.** The page load already happened. Wait for content of the new page instead (`getByText(...).waitFor()`).
- **Postgres `to_date` raises on impossible days, and `AND` does not fix evaluation order.** `to_date('2026-02-31','YYYY-MM-DD')` errors ("field value out of range") instead of rolling over, so a round-trip guard cannot protect a cast. Validate inside a `CASE` (its branches run in order): pattern first, then the day against the month's last day. Seed bad rows on the scratch DB to prove it.
- **`gh` here is an x86_64 build whose git call fails through `xcrun`.** Run it outside the repo with `-R Satzhan7/diploma` (`cd /tmp && gh pr view 10 -R …`); push with plain `git`.

## 2026-10-05 — Redesign R4

- **The login route is throttled at 10/min per IP, and QA scripts hit it.** Polling `/auth/login` to see whether a restarted backend is up burned the limit in seconds. Poll an authed GET with an existing token (tokens survive a restart: same secret), log in once per role, and give browser contexts the tokens through `addInitScript` (`accessToken` / `refreshToken` in localStorage) instead of the form. Keep one real form login per run.
- **An axios instance with a default `Content-Type: application/json` serialises `FormData` to JSON.** Pass `{ headers: { 'Content-Type': 'multipart/form-data' } }` on uploads; the browser then sets the boundary.
- **Images from the API need the frontend CSP's `img-src`.** Dev serves the API on another origin, and private images shown from object URLs need `blob:`. The CSP is a template variable (`CSP_IMG_SRC`) like `CSP_CONNECT_SRC`.
- **A compose `environment:` list item containing `: ` is a YAML mapping.** Quote the whole item (`- "CSP_IMG_SRC='self' data: blob: …"`); check with `docker compose config -q`.
- **Public uploads must lose their metadata.** Phone JPEGs carry GPS in EXIF; a magic-byte check alone serves it to everyone. Strip APP1/APP13/COM (JPEG), text/eXIf chunks (PNG), EXIF/XMP chunks (WebP) and refuse broken structures.
- **The `security-review` skill diffs against `origin/HEAD`, which shares no history with these branches** (see the 2026-10-01 note). Do the security pass inline against the PR base and record it in todo.md.
- **`Number(undefined) !== Number(undefined)` is true (NaN).** A "did the value change" check must skip fields the patch does not set, and a partial jsonb patch should merge, not replace.
- **A re-login rotates the only stored refresh token, so update tokens in open browser contexts.** An `addInitScript` that sets tokens runs on every navigation and puts back stale ones unless it is guarded (seed once per tab with a `sessionStorage` flag, then write fresh tokens into live pages after a re-login).
- **The dev backend reruns `npm ci` on every start (about 3 min).** QA restarts poll `/health`, not an authed route: access tokens last 15 minutes and logins are throttled.
- **When a flag stops granting a capability, re-test the gate with the real service, not a stub.** The paywall spec stubbed `planService.forUser`, so it could not notice that the test period no longer means Pro; the new spec drives the real `PlanService` (stored Free → 403 → checkout → allowed).
- **Never hard-code a currency format in copy.** `formatMoney(0)` is "0 ₸" in RU but "₸0" in EN and "₸ 0" in KZ; interpolate `{{price}}` from `formatMoney` and assert in QA with `\s` (Intl uses U+00A0).
- **A badge next to a note must not repeat it.** "Тестовый период" as a pill followed by "Тестовый период: …" reads twice; check alerts in a screenshot, not only by text.

## 2026-10-06 — Design system

- **Sizes and proportions were never a system.** `theme.ts` set only colours, radii and fonts, so every page picked its own widths and font sizes and the result looked off. Define type, spacing, control and container tokens before building screens, and ban raw px in pages.
- **Chakra `extendTheme` merges component `sizes` into the defaults, and size styles beat `textStyle`.** Heading's default sizes are `[base, sm, md]` arrays; an object `{ base, md }` merged into them kept the old 30/36 px, and the default `size="xl"` overrode `textStyle="h1"`. Give overrides in the default's shape (arrays), and make the default size and `baseStyle` functions that return nothing when `props.textStyle` is set. Measure computed styles after a theme change — tsc and tests pass either way.
- **Chakra's space/size scale has gaps (no 11, 13, 15, 30, …).** A missing key is used as raw px: `h={{ base: 11 }}` rendered 11 px buttons on mobile. Use named size tokens (`control.touch`) for odd values.
- **zsh: never name a shell variable `path`.** It is tied to `$PATH`; `path=${k#*:}` inside a loop made every later command "not found". Use another name (`kp`).
