# Product Structure — Influencer↔Brand Collaboration Platform

## Personas

### 1. Brand Manager ("Aizhan, marketing lead")
Goals: find vetted influencers, post campaign orders, review applicants, track campaign performance, communicate fast.
Pain points: slow discovery, no performance visibility, scattered communication.

### 2. Influencer ("Dias, content creator")
Goals: find paid campaigns matching his niche, apply quickly, track application status, prove results, get repeat work.
Pain points: opaque application status, no recommendations, manual stat reporting.

## User goals → main workflows

| Goal | Workflow | Entry |
|------|----------|-------|
| Brand: launch campaign | Create Order → review applications → accept → match created → chat → track stats | /brand/orders/create |
| Brand: discover talent | Influencers list → filter by category → profile → collaboration request | /brand/influencers |
| Influencer: earn | Orders feed → filter → detail → apply (message + price) → track in My Applications | /influencer/orders |
| Influencer: grow | Recommendations (match score) → express interest | /influencer/recommendations |
| Both: collaborate | Matches → match detail → update stats → messages | /:role/matches |

## Navigation hierarchy (implemented)

```
App shell (DashboardLayout)
├── Overview        — Dashboard
├── Work
│   ├── Orders              (brand: my orders / influencer: marketplace)
│   ├── Create Order        (brand)
│   ├── My Applications     (influencer)
│   └── Matches
├── Discover
│   ├── Influencers         (brand)
│   ├── Brands              (influencer)
│   └── Recommendations     (influencer)
├── Communication
│   └── Messages
└── Account
    ├── Profile
    └── Settings
```

Sidebar renders these as grouped sections with labels (Overview group unlabeled). Role filters items, exactly as the flat list did, but grouped for scannability.

## Dashboard structure

Row 1 — KPI stat cards (4): role-specific counters with icons.
Row 2 — Filters (date range, counterpart, category) in one collapsible card.
Row 3 — Charts: trend line + category distribution side-by-side (stack on mobile).
Row 4 — Detail table (horizontal scroll on mobile).
States: skeleton on load, EmptyState when no campaign data.

## Settings structure

Current: notifications, language, timezone (localStorage), logout, delete account.
Target (incremental): Account (profile link, email), Preferences (theme, language, timezone), Notifications, Danger zone (delete w/ AlertDialog). Sync to backend when settings API exists.

## Permissions structure

Two roles: BRAND, INFLUENCER (ADMIN exists server-side, no UI).
- Route-level: `ProtectedRoute roles={[...]}` in App.tsx
- Nav-level: navItems filtered by role
- Action-level: server enforces ownership (audit/fixes branch hardened this)

## Mobile navigation

- `< lg`: top app bar (hamburger + logo + theme toggle) + Drawer with same grouped nav + user footer.
- `≥ lg`: persistent 260px sidebar.
- Touch targets ≥ 44px for nav rows.

## Future scalability

- Nav config is data (`navItems` array w/ groups) — new sections are one entry.
- Semantic tokens decouple palette from components — rebrand = token swap.
- `components/ui/` kit is the single place for primitive patterns; pages compose.
- Roles list extensible (e.g. AGENCY) — add to enum + navItems roles.
- Filters should migrate to URL query params for shareable dashboard state (deferred).
