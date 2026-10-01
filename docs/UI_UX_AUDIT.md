# UI/UX Audit — Frontend (2026-06-10)

Scope: all 21 pages, 12 components, routing, theming, accessibility, responsiveness.
Stack: React 18 + Chakra UI v2 + React Query 5 + React Router 6 + Recharts + socket.io.

Severity: 🔴 Critical (blocks usability/launch) · 🟠 High (degrades UX) · 🟡 Medium · ⚪ Low

---

## 1. Critical issues

### 🔴 A1 — Theme hardcodes light colors globally
**Where:** `frontend/src/theme.ts` (`bg: '#FAF5FF'`, `color: 'gray.800'` in global styles)
**Impact:** Dark mode impossible app-wide; every page inherits a light-only background.
**Fix:** Semantic tokens (`bg.canvas`, `bg.surface`, `fg.default`, …) with light/dark values; remove hardcoded hex from global styles.
**Screens:** all.

### 🔴 A2 — Fixed 250px sidebar breaks mobile
**Where:** `components/DashboardLayout.tsx` (`position="fixed"`, `w="250px"`, content `ml="250px"`, no breakpoints)
**Impact:** On phones, sidebar consumes most of viewport; content crushed; no way to collapse. App effectively desktop-only.
**Fix:** Drawer-based nav below `lg`, hamburger top bar, persistent sidebar on desktop.
**Screens:** every authenticated screen.

### 🔴 A3 — No skeleton/loading system
**Where:** all pages — `if (isLoading) return <Text>Loading...</Text>` or bare `Spinner`; `App.tsx` ProtectedRoute renders raw `<div>Loading...</div>`.
**Impact:** Abrupt content swaps, layout shift, unbranded white flashes during auth check.
**Fix:** Skeleton loaders matching final layout; branded full-screen loader for app boot.
**Screens:** all data-driven screens.

### 🔴 A4 — No logout from main navigation
**Where:** `DashboardLayout.tsx` — no user section, no logout, no theme toggle.
**Impact:** Users must find Settings to log out; no identity confirmation visible.
**Fix:** User card + logout + color-mode toggle in sidebar footer.

## 2. High issues

### 🟠 B1 — Status badge logic duplicated 8+ times
**Where:** `brand/Orders.tsx`, `influencer/MyApplications.tsx`, `influencer/Orders.tsx`, `MatchDetail.tsx`, `influencer/OrderDetail.tsx`, `Matches.tsx`
**Impact:** Inconsistent color per status across screens (e.g. `withdrawn` purple vs gray); change requires 8 edits.
**Fix:** Single `<StatusBadge status={...} />` with centralized mapping.

### 🟠 B2 — Dashboards near-identical, copy-pasted
**Where:** `brand/Dashboard.tsx` (331 lines) vs `influencer/Dashboard.tsx` (338 lines) — same filter state machine, same KPI grid, same chart+table layout.
**Fix:** Shared `StatCard`, `StatCardSkeleton`; filter hook later.

### 🟠 B3 — Hardcoded light colors break dark mode on key pages
**Where (worst offenders):**
- `Messages.tsx` — `bg="gray.50"` sidebar + header, `gray.100` received bubbles
- `Profile.tsx` — `bg="gray.100"` badges, `gray.500` labels
- `Landing.tsx` — footer `bg="gray.800"` (acceptable: intentional dark section)
**Fix:** semantic tokens / `useColorModeValue`.

### 🟠 B4 — No empty-state design
**Where:** `Matches.tsx`, `brand/InfluencerList.tsx`, `influencer/BrandList.tsx`, `BrandRecommendations.tsx` render nothing when lists empty.
**Fix:** `<EmptyState icon title description action />` everywhere a collection can be empty.

### 🟠 B5 — Auth boot flash
**Where:** `App.tsx` `AppRoutes` returns `<div>App Loading...</div>`; 404 route is `<div>404 Not Found</div>` although a designed `NotFound.tsx` exists unused.
**Fix:** Branded full-screen loader; route `*` → `NotFound`.

## 3. Medium issues

### 🟡 C1 — Form strategy inconsistent
Login/Register: raw FormData, no inline validation (toast-only errors). EditProfile: react-hook-form without validation rules. CreateOrder: useState. → Standardize on react-hook-form + inline `FormErrorMessage` (future increment).

### 🟡 C2 — Chart colors hardcoded
`components/statistics/PieChart.tsx` `COLORS = ['#0088FE', ...]`, LineChart `#3182CE` — not theme-aware. → Export chart palette from theme.

### 🟡 C3 — Active nav state brittle
`location.pathname.startsWith(fullPath)` marks "Orders" active on `/brand/orders/create` AND "Create Order" too; "Profile" active on `/profile/edit`. → Longest-match selection.

### 🟡 C4 — Accessibility gaps
- Click-handler `Box`es in `Messages.tsx` chat list — not keyboard accessible
- `IconWrapper` icon buttons with empty default `aria-label`
- `gray.500` text on `gray.50` surfaces — borderline contrast
- No `as="h1/h2"` hierarchy on dashboard headings
Full list: docs/ACCESSIBILITY_AUDIT.md.

### 🟡 C5 — Settings stores to localStorage only; `window.confirm` for destructive action
Non-synced settings; native confirm instead of `AlertDialog`.

### 🟡 C6 — Dead code
Unused: `ChatWindow.tsx`, `FilterSection.tsx`, `RangeFilter.tsx`, `InfluencerCard.tsx`, `LoadingSpinner.tsx`, duplicate legacy `pages/brand/Messages.tsx` (not routed). → Delete.

## 4. Low issues

- ⚪ Toast durations vary 3000/5000ms arbitrarily
- ⚪ Mixed `Link`+RouterLink vs `Button as={RouterLink}` patterns
- ⚪ Date formatting via scattered `toLocaleDateString()` calls
- ⚪ `console.log` debugging left in `influencer/Orders.tsx` apply flow
- ⚪ Logo gradient (green→cyan→magenta) off-brand vs purple palette

## 5. Roadmap (implemented this pass)

| # | Change | Files |
|---|--------|-------|
| 1 | Design System 2.0 theme (semantic tokens, dark mode, type scale, variants) | `theme.ts`, `index.css`, `index.tsx` |
| 2 | Responsive nav shell: drawer + topbar + user footer + theme toggle | `DashboardLayout.tsx` |
| 3 | Shared UI kit: StatusBadge, StatCard, PageHeader, EmptyState, skeletons | `components/ui/*` |
| 4 | Branded app loader + real 404 | `App.tsx`, `NotFound.tsx` |
| 5 | Page adoption: skeletons/empty states/StatusBadge on Matches, dashboards, orders, applications | pages |
| 6 | Dark-mode-safe colors on Messages, Profile | pages |
| 7 | Dead code removal | components |

Deferred (follow-up increments): unified react-hook-form validation, query-param-backed filters, error boundary, settings API sync, token refresh UX.
