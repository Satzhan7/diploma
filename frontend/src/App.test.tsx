import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

test('sign-up role cards are named, described radios', async () => {
  window.history.pushState({}, '', '/register?role=brand');
  render(<App />);
  const brand = await screen.findByRole('radio', { name: i18n.t('role.brand.title', { ns: 'auth' }) });
  const creator = screen.getByRole('radio', { name: i18n.t('role.influencer.title', { ns: 'auth' }) });
  expect(brand).toBeChecked();
  expect(creator).toHaveAccessibleDescription(i18n.t('role.influencer.text', { ns: 'auth' }));
  fireEvent.click(creator);
  expect(creator).toBeChecked();
  window.history.pushState({}, '', '/');
});
