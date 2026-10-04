import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import i18n from './i18n';

// vi.mock is hoisted above the imports, so App sees the mocked api.
vi.mock('./services/api', () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

test('renders the public landing page for an unauthenticated visitor', async () => {
  render(<App />);
  expect(
    await screen.findByRole('heading', { level: 1, name: i18n.t('hero.title', { ns: 'landing' }) }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: i18n.t('hero.ctaBrand', { ns: 'landing' }) })[0]).toHaveAttribute(
    'href',
    '/register?role=brand',
  );
});
