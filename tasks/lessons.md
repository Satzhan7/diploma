# Lessons

## 2026-06-10 — audit fix session

- **GateGuard hooks block the first Edit/Write per file and destructive Bash commands; an identical retry passes.** Don't rephrase the command on retry — resend it verbatim after stating the facts. Changing the command string resets the gate.
- **Never run `rm -rf src/` with a relative path when Bash cwd persists across calls** — cwd was `backend/`, which would have deleted backend/src. Use absolute paths or `git rm` (tracked-only + trivially reversible).
- **JwtStrategy.validate must return a minimal claims object.** Spreading a TypeORM entity (`{...user}`) strips class-transformer metadata, so `@Exclude` fields (password/refreshToken hashes) leak through serialization.
- **NestJS WebSocket gateway `this.server` is null outside the HTTP runtime** (createApplicationContext for seeds/tests). Any `server.emit` helper needs a null guard or service code paths throw mid-transaction-chain.
- **Old `jwa`/`buffer-equal-constant-time` deps crash on modern host Node (SlowBuffer removed).** Run scripts inside the Node 18 container (`docker compose exec backend npm run seed`) instead of fighting host Node.
- **TypeORM: assigning `where.createdAt` twice (MoreThanOrEqual then LessThanOrEqual) silently drops the first bound** — use `Between`. And `ILike` on a `text[]` column is a runtime SQL error — use `ArrayContains`.
- **`docker compose exec psql -tAc` with multiple statements returns only the last result** — combine into one SELECT with subqueries.
