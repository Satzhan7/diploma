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
