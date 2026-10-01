# Responsive Strategy

Breakpoints (Chakra defaults): `base` <480 · `sm` 480 · `md` 768 · `lg` 992 · `xl` 1280.

## Navigation (the structural fix)

| Viewport | Shell |
|----------|-------|
| `≥ lg` | Persistent 260px sidebar (sticky, own scroll), content fills rest |
| `< lg` | Top app bar (hamburger + logo + theme toggle), nav in `Drawer` (closes on route change), full-width content |

Implementation: `DashboardLayout.tsx` — `useBreakpointValue` picks shell; single `SidebarContent` shared between fixed sidebar and Drawer (one source of nav truth).

## Layout rules

- Page gutter: `p={{ base: 4, md: 8 }}`
- Card grids: `SimpleGrid columns={{ base: 1, md: 2, xl: 3 }}` (stat rows: `{ base: 1, sm: 2, lg: 4 }`)
- Charts: side-by-side `lg`, stacked below; `ResponsiveContainer` (recharts) inside cards
- Tables: wrapped in `overflowX="auto"` containers; future increment — card-list collapse below `md`
- Forms: single column, `maxW="2xl"` on desktop
- Messages: list/thread master-detail — `< md` shows one pane at a time (list ⇄ thread with back action)

## Touch

- Nav rows ≥44px tall; buttons default `md` size (40px) minimum on touch surfaces
- No hover-only affordances: hover states always duplicate focus/active styling

## Typography

Page titles `{ base: 'xl', md: '2xl' }` via PageHeader. Landing hero `{ base: '2xl', md: '3xl' }`. Body fixed 16px (never below 16px on inputs — avoids iOS zoom).

## Images / media

Constrain by `maxW` + `objectFit="cover"`, radius `xl`; avoid fixed heights that distort on narrow screens.
