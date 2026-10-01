# Theming — Light & Dark

## Architecture

1. **Tokens, not colors.** All surfaces/text/borders go through Chakra semantic tokens defined in `theme.ts` (`bg.canvas`, `bg.surface`, `bg.subtle`, `fg.default`, `fg.muted`, `fg.subtle`, `border.default`). Components reference token names; Chakra resolves per color mode via CSS variables (`--chakra-colors-*`).
2. **Provider.** `ChakraProvider theme={theme}` (App.tsx) + `<ColorModeScript initialColorMode="system" />` rendered before the app in `index.tsx` — prevents wrong-theme flash on first paint.
3. **Persistence.** Chakra `localStorageManager` (default) stores `chakra-ui-color-mode`; survives reload.
4. **System detection.** `config.initialColorMode: 'system'`, `useSystemColorMode: false` — first visit follows OS, manual toggle wins thereafter.
5. **Toggle.** Sun/moon `IconButton` in DashboardLayout (sidebar footer + mobile top bar) calling `toggleColorMode`.

## Light theme

- Canvas `gray.50`, surfaces `white`, border-first cards (no heavy shadows)
- Text `gray.800` / `gray.600` / `gray.500` hierarchy
- Brand purple `#7C3AED` for primary actions and active nav; green `#16A34A` reserved for transactional success

## Dark theme

- No pure black: canvas `#0F1117`, surface `#161922` (slightly blue-tinted — premium, low eye strain)
- Text via `whiteAlpha` ramps (900/700/600) — softer than pure white
- Brand lightens one step in dark mode (`brand.300` for links/active states) to keep 4.5:1 contrast
- Borders `whiteAlpha.300`; elevation expressed by surface contrast, not shadow

## Rules

- Never `bg="white"`, `bg="gray.50"`, `color="gray.800"` etc. in pages — use tokens
- Intentional dark sections (Landing hero/footer) may use fixed dark colors with white text — they are mode-independent by design
- Charts: use `useColorModeValue` for grid/tooltip (already done) and theme palette for series

## Migration status

Fixed this pass: `theme.ts` globals (was hardcoded `#FAF5FF`), `DashboardLayout`, `Messages` (sidebar/header/bubbles), `Profile` (badges/labels), shared ui kit.
Remaining acceptable: Landing hero/footer (intentional), recharts series palette (cosmetic).
