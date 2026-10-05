# AdPartners.kz — Project

One reference for the product, the design direction, the UI system as built, the rules that hold and the architecture. It describes the code at the end of PR R4 (`redesign/4-plan`, 2026-10-05). The build plan and its history are in [tasks/todo.md](../tasks/todo.md); environment variables in [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md); the deal pipeline decision in [adr/0001-deal-pipeline.md](adr/0001-deal-pipeline.md).

## 1. Product

Status: diploma defended; the goal is a real product for the Kazakhstan market, run as a free test version for now.

### Users and pain
- **Hero user: a small Kazakh brand owner** (an Almaty Instagram shop or café) with no agency and a small budget, who wants local micro-influencers quickly. Works on a laptop or phone between other tasks.
- **Secondary user: a micro-influencer** (5k–50k followers) making Kazakh/Russian content, who wants paid deals without an agency. Works on a phone.
- **Pain:** finding influencers is slow. Today the owner scrolls Instagram/TikTok and DMs creators one at a time.

### Core loop
> Brand posts a brief in ~3 minutes → creators apply within 24–48 h → applicants are ranked by match score → brand accepts one → deal → creator submits a proof link → brand confirms → both rate each other.

Catalogue search and direct invites come after the loop works. Built so far: briefs (wizard, draft → open → cancelled), creator feed and apply, ranked applicants with shortlist, one Deal per accepted application (R2–R3). Proof, confirm/dispute and ratings are R5.

### Business model
| Item | Decision |
|---|---|
| Revenue | Brand subscription, **Free / Pro**, Pro priced at **19 900 ₸/month** |
| Paywall | Pro unlocks the **"Verified only"** filter: creators whose stats an admin has checked |
| Test period (`FREE_TEST_PERIOD=true`, the default) | Nobody is charged. A brand gets Pro through a real checkout for **0 ₸** (`POST /plan/checkout`, 30 days, audit row). The Plan page shows 0 ₸ plus the 19 900 ₸ note. |
| Paid path (test period off) | Brand pays by **Kaspi** transfer; an admin sets Pro in `/admin/brands`. No payment provider. |
| Deal money | Settled off-platform between brand and creator |

Cold start: seed 5–10 real brands with live paid briefs by hand; creators follow the money.

### Data and trust
- Creator stats are self-reported plus an Instagram/TikTok insights screenshot (private file, owner/admin only).
- An admin queue (`/admin/verifications`) approves a claim: the stats are copied into the profile and the creator gets the **Verified** badge. A verified creator can open a new claim on purpose.
- After a completed deal both sides rate each other (R5).

### North-star metric
**Share of briefs that receive ≥ 3 applicants within 48 hours of publishing.** Supporting: deals completed per month, share of brands posting a second brief within 30 days, number of Pro brands.

### Scope and anti-goals
| In | Out (anti-goals) |
|---|---|
| Responsive web, mobile-first for creators | In-app payments (deals and subscriptions stay off-platform or manual) |
| RU (default) + KZ + EN interface | Instagram/TikTok API integration (later; the data model stays ready) |
| Email + password, 6-digit email code on sign-up; password reset (planned) | OAuth, phone OTP, Telegram login (later) |
| Notifications: in-app bell, email, Telegram bot (Phase 7) | WhatsApp (cost + Meta approval) |
| Admin: verification queue, plans, moderation | Agency / multi-brand team features (deferred) |

Before each phase, re-read the anti-goals and cut any step that serves agencies, in-app payments or social APIs.

### Risks
1. **Kazakhstan personal-data localisation law.** Personal data of KZ citizens must be stored on servers in Kazakhstan. This decides hosting and file storage (D2, before Phase 8: a KZ provider with Postgres and S3-compatible storage). Uploads now sit on a private local volume behind `StorageService`, so the backend can be swapped. Verify with a lawyer or an official source before launch.
2. **Supply quality.** Self-reported stats can be gamed; the admin queue is the only defence and does not scale past hundreds of creators.
3. **Manual billing does not scale.** Fine for the first ~50 paying brands.
4. **Paywall value.** "Verified only" is worth paying for only if enough creators are verified; verification must run ahead of the paywall.
5. **Two people, no deadline.** Scope creep is the main threat; every phase ships something usable on its own.

## 2. Design direction

| Step | Decision |
|---|---|
| Purpose | Brand: post a brief and choose a creator fast. Creator: find paid briefs and apply in one tap. |
| Tone | **Creator-energetic** where creators are shown (applicant feed, creator cards, profiles, Landing). **Calm and dense** on brand workflow screens (brief wizard, applicant comparison, deals, admin). |
| Memorable detail | The **applicant feed**: creator cards with a large avatar, content strip (portfolio, up to 6 images), match score ring and Verified badge, which the brand compares or goes through one by one. |
| Visual reference | "Liquid Glass" / Apple HIG: glass chrome over a soft gradient canvas, solid cards for content. |
| Constraints | Chakra UI v2 on Vite; semantic tokens with light/dark; WCAG AA; RU/KZ text is ~30% longer than EN; mobile-first. |

**Anti-patterns:** a generic purple SaaS primary; cards inside cards; feature descriptions written into the UI; invented numbers (e.g. a "82% of briefs…" stat with no data behind it); raw hex colours or palette shades in pages.

## 3. Current UI system (as built, R1–R4)

Source of truth: [frontend/src/index.css](../frontend/src/index.css) (colour variables) and [frontend/src/theme.ts](../frontend/src/theme.ts) (Chakra `extendTheme`). Pages use semantic tokens only.

### Colour
Colours are CSS variables `--ap-*` in `index.css`, defined for light (`:root`), dark (`:root[data-theme='dark']`, which Chakra sets), `prefers-contrast: more` (stronger `--ap-line` and `--ap-muted`) and `prefers-reduced-transparency: reduce` (solid chrome, no blur, flat canvas). `theme.ts` maps semantic tokens onto them:

| Semantic token | Variable | Light | Dark |
|---|---|---|---|
| body background | `--ap-canvas` | 3 radial gradients over `#f2f2f7` | 3 radial gradients over `#000000` |
| `bg.canvas` | `--ap-bg` | `#f2f2f7` | `#000000` |
| `bg.surface` | `--ap-surface` | `#ffffff` | `#1c1c1e` |
| `bg.subtle` | `--ap-subtle` | `#ededf2` | `#2c2c2e` |
| `bg.muted`, `border.default` | `--ap-line` | `#e3e3e8` | `#38383a` |
| `fg.default` | `--ap-fg` | `#000000` | `#f5f5f7` |
| `fg.muted`, `fg.subtle` | `--ap-muted` | `#6c6c72` | `#a1a1a8` |
| `primary` / `primary.fg` | `--ap-primary` / `--ap-on-primary` | `#1e6ef4` / white | `#0091ff` / white |
| `primary.soft` / `primary.ink`, `accent.solid` | `--ap-primary-soft` / `--ap-primary-ink` | 12% blue / `#1a5fd6` | 20% blue / `#5cb8ff` |
| `success` (+ `.fg`, `.soft`) | `--ap-accent` | `#248a3d` | `#30d158` |
| `verified` (+ `.soft`) | `--ap-verified` | `#5148d8` | `#8e9bff` |
| `warn` (+ `.soft`) | `--ap-warn` | `#c93400` | `#ff9230` |
| `danger` (+ `.soft`) | `--ap-danger` | `#d70015` | `#ff6961` |
| `chrome.bg` / `chrome.border` | `--ap-chrome` / `--ap-chrome-border` | white 58% / 75% | `#2c2c32` 55% / white 14% |

`brand` (blue, 500 = `#1E6EF4`) and `accent` (green, 500 = `#248A3D`) scales exist only for Chakra components that take a `colorScheme`. `colorScheme="brand"` buttons (solid, outline, ghost, link) are remapped to the semantic primary so dark mode gets the dark-mode blue.

### Shape, type, styles
- **Radii:** `sm` 8 · `md` 12 · `lg` 16 · `xl` 22 (cards, modals) · `2xl` 26 (glass chrome) · `3xl` 32 (tab bar) · `full` (buttons, badges, pills).
- **Fonts:** system stack only, no web fonts: `-apple-system, BlinkMacSystemFont, 'SF Pro Display'/'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif`; mono `ui-monospace, SFMono-Regular, Menlo, Consolas`.
- **Text style** `display`: 700, letter spacing -0.022em, line height 1.08. Headings: 700, -0.022em, 1.15.
- **Layer styles:** `glass` (chrome bg, `blur(28px) saturate(180%)`, chrome border and shadow) for navigation chrome; `card` (surface, 1px line, radius `xl`) for content.
- **Component defaults:** Button 600 weight, radius `full`, `colorScheme` brand; Card surface + 1px border, radius `xl`, no shadow; Badge radius `full`, no uppercase; Input/Select/Textarea/NumberInput focus border `primary`; Modal surface, radius `xl`; Menu surface, radius `md`; Tabs/Switch/Checkbox/Radio `colorScheme` brand.
- **Focus:** global `:focus-visible` outline 3px `--ap-primary`, offset 2px.

> **No type, spacing, container or control-size scale yet; next: R4b.** Font sizes, line heights, spacing, container widths, control heights and breakpoints fall back to Chakra defaults, and pages pick raw values (e.g. `maxW` 880/720/520/440px). R4b defines these tokens in the "Design system" section below and moves every page onto them.

### App shell ([components/AppShell.tsx](../frontend/src/components/AppShell.tsx))
- **≥ lg:** floating glass sidebar (232 px wide, 12 px inset, radius `2xl`): logo, role nav (nav rows min 42 px, font `sm`, active = `primary.soft` + `primary.ink`, longest-prefix match), language switcher, colour-mode toggle, account menu.
- **< lg:** glass top bar (56 px: account avatar menu, page title, colour-mode toggle) and a floating glass tab bar (64 px, 18 px above the safe area, radius `3xl`, 11 px labels from `nav.short.*`). Items marked `noTab` (New brief, Plan, Stats) stay out of the tab bar.
- Nav per role: Brand — Home, New brief, Briefs, Applicants, Deals, Messages, Plan. Creator — Find briefs, My applications, Deals, Messages, Profile, Stats. Admin — Verifications, Brands.
- Skip link to `#main`; `aside`, `nav` (labelled) and `main` landmarks; `aria-current="page"` on the active item. Main content: `px {base 4, md 8}`, offset by the sidebar on desktop and by the bars on mobile.

### Component kit ([components/ui/](../frontend/src/components/ui/), exported from `index.ts`)
| Component | Role |
|---|---|
| `StatusPill` | Small rounded label; tones success / warn / verified / neutral / primary / danger |
| `StatusBadge` | The single status → tone map for briefs, applications and deals; translated text |
| `VerifiedBadge` | "Verified" pill (admin-checked stats) |
| `ScoreRing` | Match score 0–100 as a conic ring, `role="img"` with a label |
| `SegmentedControl` | iOS-style segmented control (language switcher, Auth tabs, view modes) |
| `PageHeader` | The page's single `h1` (display style, 28/34 px), subtitle, actions |
| `EmptyState` | Icon in a circle, `h2` title, muted text, optional action |
| `StatCard` | KPI card: icon chip, label, number |
| `StatCardSkeleton`, `CardGridSkeleton` | Layout-matched loading placeholders |
| `BriefCard` | Brief/deal summary: party, badge, title, chips, amount, action |
| `CreatorCard` | Applicant card: avatar, Verified, ScoreRing, stats, pitch, price, content strip (first 3 portfolio images) |
| `Stepper` | Ordered progress list (deal status) |

Shared outside the kit: `AppShell`, `ColorModeToggle`, `LanguageSwitcher`, `IconWrapper` (react-icons → Chakra), `Logo`, `PrivateImage` (authorised file fetch), `DealCard`, `RecentDeals`.

## 4. Rules that still hold

**Accessibility (WCAG AA)**
- Every interactive element is a real `button`/`a`/form control (Chakra `as=` when needed); every icon-only button has an `aria-label`.
- One `h1` per page (via `PageHeader`), sections `h2`, cards `h3`.
- Status is never colour-only: pills always carry text.
- Focus is never removed, only restyled. Modals and drawers keep Chakra's focus trap; destructive confirmations use `AlertDialog` (Settings' account deletion still uses `window.confirm`; R6).
- Content regions load with skeletons; spinners only inside buttons (`isLoading`) and the full-screen boot loader, which has a visible label.
- Form errors are field-level (`getFieldErrors()`) plus a form-level alert for errors without a visible field.
- Respect `prefers-contrast: more` and `prefers-reduced-transparency` through the `--ap-*` variables. Targets: ≥ 24 px everywhere, ≥ 44 px for mobile primary actions (sidebar nav rows are 42 px today; R4b/R6).

**Components**
1. A pattern used on ≥ 2 pages moves to `components/ui/`; kit components carry no page-specific logic.
2. Collections always have three states: skeleton, `EmptyState`, content.
3. One icon set: Feather via `react-icons/fi`, rendered through `IconWrapper`.
4. Colours only through semantic tokens. The ESLint `no-restricted-syntax` guard rejects hex colours, palette shades (`gray.500`, `brand.400`, …) and purple/teal/green/blue `colorScheme`s in pages and components (Logo artwork exempt).
5. Never show invented data; when there is none, say so.

**i18n**
- `react-i18next`, namespaces in `src/i18n/locales/<lang>/<ns>.json`; RU is the default, Kazakh is `kk` (labelled KZ), then EN. The choice is kept in `localStorage` `lang` and `<html lang>`.
- Every new string goes into all three locales; a Vitest key-parity test enforces it.
- The backend returns error codes (`{ statusCode, code, message, details? }`); the frontend translates them with `getErrorMessage()` (every `ErrorCode` must have a translation) and validation details with `errors:validation.<rule>`.
- Dates, numbers and money (₸) go through `formatDate` / `formatNumber` / `formatMoney`. Layouts must survive RU/KZ text ~30% longer than EN.

**Theming**
- `initialColorMode: 'system'`, `useSystemColorMode: false`: the first visit follows the OS, the toggle wins afterwards (stored by Chakra). `ColorModeScript` in `index.tsx` prevents a wrong-theme flash.
- Light/dark values live only in `index.css`; components never branch on colour mode for colours.

## 5. Performance budgets

| Metric | Budget | Now |
|---|---|---|
| First-load JS (entry + modulepreload list in `build/index.html`) | < 250 kB gzip; each design change adds at most a few kB | 807 292 bytes raw at `893fecc` (gzip not recorded) |
| Main chunk | Below Vite's 500 kB warning | Every page is a lazy chunk; the shell and auth flow stay in the main bundle |
| CLS | < 0.1 | Skeletons match the final layout |
| LCP | < 2.5 s on 4G | No web fonts, no font request |
| Interaction latency (nav, theme toggle) | < 100 ms | Colour mode switches CSS variables; no per-component re-render for colour |

Other defaults: React Query `staleTime: 30_000`.

## 6. Architecture summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 8, TypeScript, Chakra UI 2.8, React Router 6, TanStack Query 5, react-i18next, socket.io-client; Vitest + RTL; served by nginx in its Docker image |
| Backend | NestJS 10 on Node 24, TypeORM 0.3, Passport JWT (access + refresh), socket.io gateway, Swagger, global throttler (100/min; tighter on auth routes); Jest |
| Database | PostgreSQL 14; migrations (`migrationsRun` in production), `synchronize` only in dev |
| Infra | Docker Compose. Dev: `postgres`, `backend` (API on :3005), `mailpit` (:8025), `frontend` (:3000). Prod: `postgres`, `backend`, `frontend`, `nginx` (TLS) and `certbot`. Volumes `postgres_data`, `uploads_data`. CI: GitHub Actions, both apps' typecheck, lint, tests and build. |

**Backend modules** (`backend/src`):
- `auth`: register, 6-digit email code (`email_verification`), login, refresh, profile; `mail` (SMTP, in-memory in tests).
- `users`, `profiles`: accounts and brand/creator profiles; `match-score.ts` ranks applicants.
- `orders`: briefs (DRAFT → OPEN → CANCELLED) and applications; `categories`: static list.
- `deals`: one Deal per accepted application, transitions in `deal-transitions.ts` (ADR 0001).
- `chats`: REST + WebSocket gateway, limited to pairs that share an application or deal; emails are never shown to the other side.
- `files`: `StorageService` on a private disk (`UPLOAD_DIR`), type from magic bytes, metadata stripped, 5 MB limit; `GET /files/:id` (portfolio public, screenshots owner/admin only).
- `plan`: Free/Pro, effective plan computed on read from `plan` + `proExpiresAt`, the 0 ₸ checkout.
- `verification`: one claim per creator, admin approve/reject (compare-and-set).
- `admin`: verification queue, brands and plans; every admin action writes `audit_log` in the same transaction.

Every list endpoint is paginated (`Page<T>`, `take`/`skip`, default 20). Every schema change is a migration generated against the previous one, with no drift (`migration:generate --dr`).

## 7. Design system

R4b writes its spec here: standards comparison, measured current state, the type / spacing / layout / control-size proposal and the before/after results.
