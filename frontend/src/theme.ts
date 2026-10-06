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

// Breakpoints (Tailwind/Primer-aligned, docs/PROJECT.md §7): the sidebar appears at lg.
const breakpoints = {
  base: '0em',
  sm: '40em', // 640
  md: '48em', // 768
  lg: '64em', // 1024
  xl: '80em', // 1280
  '2xl': '96em', // 1536
};

// Chakra's 4 px space scale (1 = 4px … 20 = 80px) and Tailwind font-size keys
// (xs 12, sm 14, md 16, lg 18, xl 20, 2xl 24, 3xl 30, 4xl 36) stay as they are.
const lineHeights = {
  display: 1.08,
  heading: 1.2,
  snug: 1.3,
  body: 1.5,
};

const letterSpacings = {
  display: '-0.022em',
  heading: '-0.018em',
  title: '-0.01em',
  caption: '0.01em',
};

// Widths and heights. Containers: narrow = forms and reading, default = app
// pages, wide = data tables and two-pane screens. Controls: sm / md / lg.
const sizes = {
  container: {
    narrow: '720px',
    default: '1120px',
    wide: '1440px',
    prose: '65ch',
  },
  // App shell chrome (AppShell): floating sidebar ≥ lg, top bar and tab bar < lg.
  sidebar: '248px',
  topbar: '56px',
  tabbar: '64px',
  navItem: '44px',
  control: { sm: '32px', md: '40px', lg: '48px', touch: '44px' },
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

// The type scale (docs/PROJECT.md §7). Body never below 16, UI text never below 12.
const textStyles = {
  display: {
    fontFamily: 'heading',
    fontSize: { base: '40px', md: '56px' },
    fontWeight: 700,
    letterSpacing: 'display',
    lineHeight: 'display',
  },
  h1: {
    fontFamily: 'heading',
    fontSize: { base: '28px', md: '32px' },
    fontWeight: 700,
    letterSpacing: 'display',
    lineHeight: 'heading',
  },
  h2: {
    fontFamily: 'heading',
    fontSize: { base: '22px', md: '24px' },
    fontWeight: 700,
    letterSpacing: 'heading',
    lineHeight: 1.25,
  },
  h3: {
    fontFamily: 'heading',
    fontSize: { base: '18px', md: '20px' },
    fontWeight: 600,
    letterSpacing: 'title',
    lineHeight: 'snug',
  },
  lead: { fontSize: 'lg', lineHeight: 1.55 },
  body: { fontSize: 'md', lineHeight: 'body' },
  small: { fontSize: 'sm', lineHeight: 1.43 },
  label: { fontSize: 'sm', lineHeight: 1.43, fontWeight: 600 },
  caption: { fontSize: 'xs', lineHeight: 1.33, fontWeight: 500, letterSpacing: 'caption' },
};

// Responsive layout spacing on the 4 px scale, used by the layout primitives.
export const layout = {
  pageX: { base: 4, md: 6, lg: 8 }, // 16 / 24 / 32
  pageY: { base: 6, lg: 8 }, // 24 / 32
  section: { base: 6, md: 8 }, // 24 / 32: page header → content and between sections
  card: { base: 4, md: 6 }, // 16 / 24 card padding
  grid: { base: 4, md: 6 }, // 16 / 24 between cards
  stack: { sm: 2, md: 3, lg: 4 }, // 8 / 12 / 16
} as const;

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

// Control heights: sm 32, md 40 (44 on touch-sized screens), lg 48.
const controlSizes = {
  sm: { h: 8, minW: 8, fontSize: 'sm', px: 3 },
  md: { h: { base: 'control.touch', md: 'control.md' }, minW: { base: 'control.touch', md: 'control.md' }, fontSize: 'md', px: 4 },
  lg: { h: 12, minW: 12, fontSize: 'md', px: 6 },
};
const fieldSizes = {
  sm: { field: { h: 8, fontSize: 'sm', px: 3, borderRadius: 'sm' }, addon: { h: 8, borderRadius: 'sm' } },
  md: {
    field: { h: { base: 'control.touch', md: 'control.md' }, fontSize: 'md', px: 4, borderRadius: 'md' },
    addon: { h: { base: 'control.touch', md: 'control.md' }, borderRadius: 'md' },
  },
  lg: { field: { h: 12, fontSize: 'md', px: 4, borderRadius: 'md' }, addon: { h: 12, borderRadius: 'md' } },
};
// Heading sizes map onto the text styles, so `<Heading size>` cannot leave the scale.
// Chakra's default sizes use [base, sm, md] arrays and extendTheme merges into them,
// so ours are arrays too. Default size `auto`: an h2 unless a textStyle is given
// (size styles beat textStyle, so a Heading with a textStyle must not get one).
type Responsive = { base: string; md: string };
const headingSize = (style: 'display' | 'h1' | 'h2' | 'h3') => {
  const { fontSize, ...rest } = textStyles[style];
  const { base, md } = fontSize as Responsive;
  return { ...rest, fontSize: [base, null, md] };
};

const theme = extendTheme({
  config,
  fonts,
  colors,
  semanticTokens,
  breakpoints,
  lineHeights,
  letterSpacings,
  sizes,
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
      sizes: controlSizes,
      variants: {
        solid: brandVariant('solid'),
        outline: brandVariant('outline'),
        ghost: brandVariant('ghost'),
        link: brandVariant('link'),
      },
      defaultProps: { colorScheme: 'brand', size: 'md' },
    },
    IconButton: { defaultProps: { size: 'md' } },
    Card: {
      // Card padding 16 / 24 (layout.card) for every CardBody/Header/Footer.
      sizes: { md: { container: { '--card-padding': { base: '16px', md: '24px' } } } },
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
      baseStyle: {
        borderRadius: 'full',
        fontWeight: '600',
        textTransform: 'none',
        px: 2,
        fontSize: 'xs',
        lineHeight: 1.33,
      },
    },
    Heading: {
      baseStyle: (props: StyleFunctionProps) =>
        props.textStyle ? {} : { fontWeight: 700, letterSpacing: 'heading', lineHeight: 'heading' },
      sizes: {
        '4xl': headingSize('display'),
        '3xl': headingSize('h1'),
        '2xl': headingSize('h1'),
        xl: headingSize('h1'),
        lg: headingSize('h2'),
        md: headingSize('h3'),
        sm: { fontSize: 'lg', lineHeight: 'snug', fontWeight: 600, letterSpacing: 'title' },
        xs: { fontSize: 'md', lineHeight: 'snug', fontWeight: 600, letterSpacing: 'normal' },
        auto: (props: StyleFunctionProps) => (props.textStyle ? {} : headingSize('h2')),
      },
      defaultProps: { size: 'auto' },
    },
    Input: { sizes: fieldSizes, defaultProps: { ...field, size: 'md' } },
    Select: { sizes: fieldSizes, defaultProps: { ...field, size: 'md' } },
    NumberInput: { sizes: fieldSizes, defaultProps: { ...field, size: 'md' } },
    Textarea: {
      sizes: {
        sm: { fontSize: 'sm', px: 3, borderRadius: 'sm' },
        md: { fontSize: 'md', px: 4, py: 2, borderRadius: 'md' },
        lg: { fontSize: 'md', px: 4, py: 3, borderRadius: 'md' },
      },
      defaultProps: { ...field, size: 'md' },
    },
    Modal: {
      baseStyle: {
        dialog: { bg: 'bg.surface', borderRadius: 'xl' },
        header: {
          fontSize: { base: '18px', md: '20px' },
          fontWeight: 600,
          letterSpacing: 'title',
          px: 6,
          pt: 6,
          pb: 2,
        },
        body: { px: 6, py: 2 },
        footer: { px: 6, pt: 4, pb: 6, gap: 3 },
      },
    },
    Drawer: { baseStyle: { dialog: { bg: 'bg.surface' } } },
    Menu: {
      baseStyle: {
        list: { bg: 'bg.surface', borderColor: 'border.default', borderRadius: 'md', py: 1, boxShadow: 'md' },
        item: {
          bg: 'transparent',
          minH: 10,
          px: 3,
          fontSize: 'sm',
          _hover: { bg: 'bg.subtle' },
          _focus: { bg: 'bg.subtle' },
        },
      },
    },
    Tabs: { defaultProps: { colorScheme: 'brand', size: 'md' } },
    Tooltip: { baseStyle: { fontSize: 'sm', lineHeight: 1.43, px: 3, py: 1.5, borderRadius: 'sm' } },
    Switch: { defaultProps: { colorScheme: 'brand' } },
    Checkbox: { defaultProps: { colorScheme: 'brand' } },
    Radio: { defaultProps: { colorScheme: 'brand' } },
  },
});

export default theme;
