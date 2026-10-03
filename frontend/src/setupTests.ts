// jest-dom adds DOM matchers such as toBeInTheDocument() to Vitest's expect.
import '@testing-library/jest-dom/vitest';
import i18n from './i18n';

// Tests assert on English copy; the app default (RU) is covered in i18n.test.ts.
beforeEach(async () => {
  await i18n.changeLanguage('en');
});

// Chakra's color-mode provider queries this browser API during test renders.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
