import { extendTheme, type StyleFunctionProps, type ThemeConfig } from '@chakra-ui/react';

// "Liquid Glass" design system (Apple HIG). Colour values live in index.css
// as --ap-* variables (light, dark, more contrast, reduced transparency);
// the semantic tokens below point at them. Pages use semantic tokens only.

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: false,
};

const fonts = {
  heading: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, 'Segoe UI', Roboto, sans-serif`,
  body: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif`,
  mono: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
};

// Scales for components that still take a colorScheme (500 = primary).
const colors = {
  brand: {
    50: '#EAF2FE',
    100: '#CFE0FD',
    200: '#9EC2FB',
    300: '#6CA3F8',
    400: '#4489F6',
    500: '#1E6EF4',
    600: '#1A5FD6',
    700: '#154DAF',
    800: '#103B87',
    900: '#0B2A5F',
  },
  accent: {
    50: '#EAF7EE',
    100: '#C9EBD3',
    200: '#97D9AA',
    300: '#62C67F',
    400: '#3DAE5C',
    500: '#248A3D',
    600: '#1E7533',
    700: '#185E29',
    800: '#12471F',
    900: '#0B3014',
  },
};

const v = (name: string) => `var(--ap-${name})`;

const semanticTokens = {
  colors: {
    'bg.canvas': v('bg'),
    'bg.surface': v('surface'),
    'bg.subtle': v('subtle'),
    'bg.muted': v('line'),
    'fg.default': v('fg'),
    'fg.muted': v('muted'),
    'fg.subtle': v('muted'),
    'border.default': v('line'),
    'accent.solid': v('primary-ink'),
    primary: v('primary'),
    'primary.fg': v('on-primary'),
    'primary.soft': v('primary-soft'),
    'primary.ink': v('primary-ink'),
    success: v('accent'),
    'success.fg': v('on-accent'),
    'success.soft': v('accent-soft'),
    verified: v('verified'),
    'verified.soft': v('verified-soft'),
    warn: v('warn'),
    'warn.soft': v('warn-soft'),
    danger: v('danger'),
    'danger.soft': v('danger-soft'),
    'chrome.bg': v('chrome'),
    'chrome.border': v('chrome-border'),
  },
};

// Card 22, small 12, pills full; glass chrome 26, tab bar 32.
const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '22px',
  '2xl': '26px',
  '3xl': '32px',
};

const layerStyles = {
  glass: {
    bg: 'chrome.bg',
    backdropFilter: v('chrome-filter'),
    borderWidth: '1px',
    borderColor: 'chrome.border',
    boxShadow: v('chrome-shadow'),
  },
  card: {
    bg: 'bg.surface',
    borderWidth: '1px',
    borderColor: 'border.default',
    borderRadius: 'xl',
  },
};

const textStyles = {
  display: {
    fontFamily: 'heading',
    fontWeight: 700,
    letterSpacing: '-0.022em',
    lineHeight: 1.08,
  },
};

// colorScheme="brand" maps to the semantic primary so dark mode gets the
// dark-mode blue (Chakra's default would use brand.200 with dark text).
const brandVariant = (variant: string) => (props: StyleFunctionProps) => {
  if (props.colorScheme !== 'brand') return {};
  if (variant === 'solid') {
    return {
      bg: 'primary',
      color: 'primary.fg',
      _hover: { bg: 'primary', filter: 'brightness(1.08)', _disabled: { bg: 'primary', filter: 'none' } },
      _active: { bg: 'primary', filter: 'brightness(0.94)' },
    };
  }
  return {
    color: 'primary.ink',
    borderColor: variant === 'outline' ? 'border.default' : undefined,
    _hover: { bg: 'primary.soft' },
    _active: { bg: 'primary.soft' },
  };
};

const field = { focusBorderColor: 'primary' };

const theme = extendTheme({
  config,
  fonts,
  colors,
  semanticTokens,
  radii,
  layerStyles,
  textStyles,
  styles: {
    global: {
      body: {
        background: v('canvas'),
        backgroundAttachment: 'fixed',
        color: 'fg.default',
      },
      '::placeholder': { color: 'fg.muted' },
      ':focus-visible': { outline: `3px solid ${v('primary')}`, outlineOffset: '2px' },
    },
  },
  components: {
    Button: {
      baseStyle: { fontWeight: '600', borderRadius: 'full' },
      variants: {
        solid: brandVariant('solid'),
        outline: brandVariant('outline'),
        ghost: brandVariant('ghost'),
        link: brandVariant('link'),
      },
      defaultProps: { colorScheme: 'brand' },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'bg.surface',
          borderWidth: '1px',
          borderColor: 'border.default',
          borderRadius: 'xl',
          boxShadow: 'none',
        },
      },
    },
    Badge: {
      baseStyle: { borderRadius: 'full', fontWeight: '600', textTransform: 'none', px: 2 },
    },
    Heading: {
      baseStyle: { fontWeight: 700, letterSpacing: '-0.022em', lineHeight: '1.15' },
    },
    Input: { defaultProps: field },
    Select: { defaultProps: field },
    Textarea: { defaultProps: field },
    NumberInput: { defaultProps: field },
    Modal: { baseStyle: { dialog: { bg: 'bg.surface', borderRadius: 'xl' } } },
    Drawer: { baseStyle: { dialog: { bg: 'bg.surface' } } },
    Menu: {
      baseStyle: {
        list: { bg: 'bg.surface', borderColor: 'border.default', borderRadius: 'md', py: 1 },
        item: { bg: 'transparent', _hover: { bg: 'bg.subtle' }, _focus: { bg: 'bg.subtle' } },
      },
    },
    Tabs: { defaultProps: { colorScheme: 'brand' } },
    Switch: { defaultProps: { colorScheme: 'brand' } },
    Checkbox: { defaultProps: { colorScheme: 'brand' } },
    Radio: { defaultProps: { colorScheme: 'brand' } },
  },
});

export default theme;
