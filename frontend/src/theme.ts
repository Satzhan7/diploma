import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Design System 2.0 — see docs/DESIGN_SYSTEM.md and docs/THEMING.md.
// Pages must use semantic tokens (bg.canvas, bg.surface, fg.muted, ...)
// instead of hardcoded colors so both color modes work everywhere.

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: false,
};

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
  mono: `'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace`,
};

// Trust purple + transaction green palette (P2P marketplace).
// brand.500 (#7C3AED) is the primary; accent.500 (#16A34A) is for
// money/success actions (accept application, complete order).
const colors = {
  brand: {
    50: '#F5F3FF',
    100: '#DDD6FE',
    200: '#C4B5FD',
    300: '#A78BFA',
    400: '#8B5CF6',
    500: '#7C3AED',
    600: '#6D28D9',
    700: '#5B21B6',
    800: '#4C1D95',
    900: '#3B0764',
  },
  accent: {
    50: '#F0FDF4',
    100: '#BBF7D0',
    200: '#86EFAC',
    300: '#4ADE80',
    400: '#22C55E',
    500: '#16A34A',
    600: '#15803D',
    700: '#166534',
    800: '#14532D',
    900: '#052E16',
  },
};

// Dark surfaces are blue-tinted neutrals, never pure black.
const semanticTokens = {
  colors: {
    'bg.canvas': { default: 'gray.50', _dark: '#0F1117' },
    'bg.surface': { default: 'white', _dark: '#161922' },
    'bg.subtle': { default: 'gray.100', _dark: 'whiteAlpha.100' },
    'bg.muted': { default: 'gray.200', _dark: 'whiteAlpha.200' },
    'fg.default': { default: 'gray.800', _dark: 'whiteAlpha.900' },
    'fg.muted': { default: 'gray.600', _dark: 'whiteAlpha.700' },
    'fg.subtle': { default: 'gray.500', _dark: 'whiteAlpha.600' },
    'border.default': { default: 'gray.200', _dark: 'whiteAlpha.300' },
    'accent.solid': { default: 'brand.500', _dark: 'brand.300' },
  },
};

const theme = extendTheme({
  config,
  fonts,
  colors,
  semanticTokens,
  styles: {
    global: {
      body: {
        bg: 'bg.canvas',
        color: 'fg.default',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'md',
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'bg.surface',
          borderWidth: '1px',
          borderColor: 'border.default',
          borderRadius: 'lg',
          boxShadow: 'none',
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'md',
        fontWeight: '600',
      },
    },
    Heading: {
      baseStyle: {
        lineHeight: '1.2',
      },
    },
    Input: {
      defaultProps: { focusBorderColor: 'brand.400' },
    },
    Select: {
      defaultProps: { focusBorderColor: 'brand.400' },
    },
    Textarea: {
      defaultProps: { focusBorderColor: 'brand.400' },
    },
    NumberInput: {
      defaultProps: { focusBorderColor: 'brand.400' },
    },
    Modal: {
      baseStyle: {
        dialog: { bg: 'bg.surface', borderRadius: 'lg' },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: { bg: 'bg.surface' },
      },
    },
  },
});

export default theme;
