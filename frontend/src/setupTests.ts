// jest-dom adds DOM matchers such as toBeInTheDocument() to Vitest's expect.
import '@testing-library/jest-dom/vitest';

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
