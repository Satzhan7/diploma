# UI Performance

## Current profile

CRA (webpack) single bundle; Chakra (emotion runtime CSS-in-JS); recharts (~100KB gz) loaded for all users; socket.io-client global; React Query cache default config.

## Improvements applied

1. **Layout shift (CLS):** skeletons match final layout (StatCardSkeleton, CardGridSkeleton) — content no longer jumps from "Loading..." text to full grid. App boot shows centered full-screen loader instead of unstyled div.
2. **Theme flash:** `ColorModeScript` before hydration — no light→dark flash.
3. **Font loading:** Inter with `font-display: swap` + preconnect — text visible immediately on fallback metrics.
4. **Re-renders:** nav config hoisted to module scope (static); semantic tokens resolve via CSS variables — color mode toggle does not re-render component trees for color props using tokens (vs `useColorModeValue` per-component re-evaluation).
5. **Dead code removed:** 5 unused components + 1 legacy page out of bundle graph.

## Recommended next (not in this pass)

| Item | Win |
|------|-----|
| Route-level `React.lazy` (Landing vs app shell; recharts only on dashboards) | −30–40% initial JS for unauthenticated visitors |
| Migrate CRA → Vite | Build speed + smaller, tree-shaken output |
| `QueryClient` defaults: `staleTime: 30_000` | Eliminates redundant refetch bursts on tab focus |
| Memoize chart data transforms (`useMemo` on dashboard mapping) | Avoids recompute per keystroke in filters |
| Debounce search inputs (InfluencerList, BrandRecommendations) | Fewer API calls + renders |
| Image `loading="lazy"` on Landing sections | Faster LCP |

## Budgets

- Initial JS (gz) target: <250KB after route-splitting
- Interaction latency: <100ms for nav/sidebar/theme toggle (CSS-variable theming keeps toggle O(1))
- CLS: <0.1 (skeleton parity), LCP: <2.5s on 4G
