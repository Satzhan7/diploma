import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// vi.mock is hoisted above the imports, so App sees the mocked api.
vi.mock('./services/api', () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

test('renders the public landing page for an unauthenticated visitor', async () => {
  render(<App />);
  expect(
    await screen.findByRole('heading', {
      name: /ultimate brand-influencer connection platform/i,
    }),
  ).toBeInTheDocument();
});
