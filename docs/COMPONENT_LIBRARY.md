# Component Library

Base: Chakra UI v2 primitives (Button, Input, Select, Modal, Drawer, Tabs, Tooltip, Toast, AlertDialog) — already accessible, keyboard-navigable, focus-trapped. We standardize via theme variants + a thin app kit in `frontend/src/components/ui/`.

## App kit (`components/ui/`)

### `StatusBadge`
```tsx
<StatusBadge status="pending" />
```
Single status→colorScheme mapping for orders, applications, matches, collaborations. Unknown statuses fall back to gray. Replaces 8+ inline switch statements.

### `StatCard`
```tsx
<StatCard label="Total Orders" value={12} icon={FiList} helpText="+3 this week" />
```
KPI card: icon chip, label (fg.muted), large tabular number. Used by both dashboards.

### `StatCardSkeleton` / `CardGridSkeleton` (in `CardSkeleton.tsx`)
Layout-matched skeletons. `CardGridSkeleton count={6}` renders a responsive grid of card placeholders; prevents layout shift.

### `PageHeader`
```tsx
<PageHeader title="Orders" subtitle="Campaigns you've created" actions={<Button>New</Button>} />
```
Standard h1 + optional subtitle + right-aligned actions; responsive title size.

### `EmptyState`
```tsx
<EmptyState icon={FiInbox} title="No orders yet" description="Create your first campaign." action={<Button>Create order</Button>} />
```
Centered icon-in-circle, title, muted description, optional CTA. Used wherever a collection can be empty.

## Theme-level component standards (theme.ts)

| Component | Standard |
|-----------|----------|
| Button | colorScheme `brand` default, fontWeight 600, radius `md` |
| Card | bg `bg.surface`, 1px `border.default`, radius `lg`, shadow none |
| Badge | radius `md` |
| Input/Select/Textarea/NumberInput | focusBorderColor `brand.400` |
| Modal/Drawer | surface bg via tokens, radius `lg` |
| Heading | Inter, lineHeight 1.2 |

## Existing components (kept)

- `DashboardLayout` — responsive app shell (see RESPONSIVE_STRATEGY.md)
- `IconWrapper` — react-icons → Chakra bridge
- `Logo` — brand mark
- `UpdateStatsModal` — match stats form
- `statistics/LineChart|PieChart|StatsTable` — recharts/table wrappers

## Removed (dead code)

`ChatWindow.tsx`, `FilterSection.tsx`, `RangeFilter.tsx`, `InfluencerCard.tsx`, `LoadingSpinner.tsx` — unreferenced; pages/brand/Messages.tsx legacy duplicate (not routed).

## Rules

1. New repeated pattern (≥2 pages) → promote to `components/ui/`.
2. Kit components accept Chakra style props passthrough where sensible; no page-specific logic inside.
3. Icon buttons always provide `aria-label`.
4. Collections: always 3 states — skeleton (loading), EmptyState (no data), content.
