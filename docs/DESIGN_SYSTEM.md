# Design System 2.0

Single source of truth: `frontend/src/theme.ts` (Chakra UI v2 `extendTheme`).
Principle: pages never hardcode colors/space — they use tokens and component variants.

## Typography

| Role | Font | Fallback |
|------|------|----------|
| Display + body | Inter | system-ui stack |
| Monospace | JetBrains Mono | SFMono/Menlo stack |

Inter chosen: enterprise-standard (Linear, Vercel, Figma), excellent legibility at dashboard densities, tabular numerals for stats. Loaded via Google Fonts in `index.css` with `font-display: swap`.

Scale (Chakra defaults retained, usage standardized):

| Token | Size | Usage |
|-------|------|-------|
| `4xl/3xl` | 36/30 | Landing hero only |
| `2xl` | 24 | Page title (`PageHeader`, h1) |
| `lg` | 18 | Section/card heading (h2) |
| `md` | 16 | Body, card titles (h3) |
| `sm` | 14 | Secondary text, table cells |
| `xs` | 12 | Captions, badges, timestamps |

Line heights: headings `1.2`, body `1.6`. Weights: 700 page titles, 600 headings/buttons, 500 labels/nav, 400 body. Responsive: page titles `{ base: 'xl', md: '2xl' }` via PageHeader.

## Colors

### Brand (trust purple — primary actions, nav accents)
`brand.50 #F5F3FF → brand.500 #7C3AED → brand.900 #3B0764`

### Accent (transaction green — money/success actions: accept, complete)
`accent.50 #F0FDF4 → accent.500 #16A34A → accent.900 #052E16`

### Semantic tokens (light / dark)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `bg.canvas` | gray.50 | #0F1117 | App background |
| `bg.surface` | white | #161922 | Cards, sidebar, modals |
| `bg.subtle` | gray.100 | whiteAlpha.100 | Hover rows, received bubbles, badges |
| `bg.muted` | gray.200 | whiteAlpha.200 | Pressed, dividers strong |
| `fg.default` | gray.800 | whiteAlpha.900 | Primary text |
| `fg.muted` | gray.600 | whiteAlpha.700 | Secondary text |
| `fg.subtle` | gray.500 | whiteAlpha.600 | Captions/placeholders |
| `border.default` | gray.200 | whiteAlpha.300 | Card/input borders |
| `accent.solid` | brand.500 | brand.300 | Links, active nav |

No pure black anywhere: dark canvas `#0F1117`, surface `#161922` (blue-tinted neutrals).

### Status colors (single mapping — `components/ui/StatusBadge.tsx`)

| Status | Scheme |
|--------|--------|
| open, accepted, active, completed | green |
| pending, in_progress | yellow / blue |
| rejected, cancelled | red |
| withdrawn, closed, expired | gray |

Semantic intents: success=green.500, warning=orange.400, error=red.500, info=blue.500 (Chakra toast defaults).

## Spacing

4pt grid via Chakra scale (1 unit = 4px). Standards:
- Card padding: 5 (20px); page gutter: `{ base: 4, md: 8 }`
- Stack gaps: 4 within groups, 6 between groups, 8 between page sections
- Form field gap: 4; section heading margin-bottom: 4

## Radius

| Token | Value | Use |
|-------|-------|-----|
| `md` | 6px | Inputs, buttons, badges, nav rows |
| `lg` | 10px | Cards, modals, popovers |
| `xl` | 14px | Hero imagery, large surfaces |
| `full` | — | Avatars, pills |

## Shadows (elevation)

| Level | Token | Use |
|-------|-------|-----|
| 0 | none + border | Resting cards (border-first like Linear/Stripe) |
| 1 | `sm` | Card hover |
| 2 | `md` | Dropdowns, popovers |
| 3 | `lg` | Modals, drawers |

Dark mode: shadows fall back to borders + surface contrast (shadows invisible on dark).

## Motion

- Durations: 120ms (hover/focus), 200ms (expand/collapse, drawer), 300ms max (page-level)
- Easing: `ease-out` enter, `ease-in` exit
- Hover: color/bg transitions only; subtle `translateY(-2px)` allowed on interactive cards
- Loading: Chakra `Skeleton` shimmer; never spinner for content regions (spinner OK inside buttons)
- Respect `prefers-reduced-motion` (Chakra/framer-motion honor it)

## Icons

Single set: **Feather via `react-icons/fi`** (already dominant in codebase). Rendered through `IconWrapper` for Chakra style props. Sizes: 16 inline, 20 nav, 24 empty states/stat cards. Replace stray `BsFileEarmarkPlus`/`BsLightbulb` with `FiFilePlus`/`FiZap` over time.

## Component variants (theme-level)

- `Button`: default colorScheme `brand`; `accent` green reserved for money/finalizing actions
- `Card`: bg `bg.surface`, border `border.default`, radius `lg`, shadow none
- `Badge`: radius `md`, font 12/600
- Inputs: `focusBorderColor: brand.400`
