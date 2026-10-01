# Accessibility Audit — WCAG 2.1 AA

Baseline strengths (Chakra v2): focus-trapped modals/drawers, `FormControl`+`FormLabel` association, visible focus rings, AlertDialog `leastDestructiveRef` already used (Profile, MyApplications).

## Findings & status

| # | Issue | WCAG | Where | Status |
|---|-------|------|-------|--------|
| 1 | Clickable `Box` chat rows — no keyboard access | 2.1.1 | `Messages.tsx` chat list | ✅ Fixed: `as="button"`, full-width, focus styles |
| 2 | `IconWrapper` icon buttons default `aria-label=""` | 4.1.2 | `IconWrapper.tsx` consumers | ✅ Fixed: labels at call sites (nav toggle, theme toggle) |
| 3 | No `h1` per page; heading sizes without semantic levels | 1.3.1 | dashboards, list pages | ✅ Fixed where PageHeader adopted (`as="h1"`); remaining pages incremental |
| 4 | App boot/auth loading is bare `<div>` (no announce) | 4.1.3 | `App.tsx` | ✅ Fixed: full-screen loader with `Spinner` + visible label |
| 5 | `gray.500` on `gray.50` borderline contrast (4.6:1 — passes AA for normal text but used at `sm`) | 1.4.3 | captions app-wide | ✅ Mitigated: `fg.muted` = gray.600 (7:1) for secondary text; `fg.subtle` only for captions |
| 6 | Mobile: no nav landmark separation | 1.3.1 | layout | ✅ Fixed: `as="nav"` + `aria-label="Main navigation"`, content in `as="main"` |
| 7 | Theme toggle discoverability + label | 4.1.2 | layout | ✅ `aria-label="Switch to dark/light mode"` dynamic |
| 8 | `window.confirm` for delete in Settings | — (UX) | `Settings.tsx` | ⏳ Deferred: replace with AlertDialog |
| 9 | Status conveyed by color only in badges | 1.4.1 | StatusBadge | ✅ Badge always includes text label, never color-only |
| 10 | Charts lack text alternative | 1.1.1 | dashboards | ⏳ Deferred: StatsTable adjacent serves as data alternative — document pairing |
| 11 | Enter-to-send without Shift+Enter newline | — (UX) | Messages input | ⏳ Deferred |
| 12 | Yellow star icons `yellow.400` decorative contrast | 1.4.11 | BrandRecommendations | OK — accompanied by numeric score |

## Standards going forward

1. Every interactive element: real `button`/`a` semantics (Chakra `as=` if needed).
2. Every icon-only button: `aria-label`.
3. Page = exactly one `h1` (PageHeader), sections `h2`, cards `h3`.
4. Text contrast: `fg.default` ≥7:1, `fg.muted` ≥4.5:1 both modes; brand link color lightened in dark mode (`brand.300`).
5. Skeletons over spinners (no spinner-only regions); buttons keep `isLoading`.
6. Focus is never removed — only restyled.
