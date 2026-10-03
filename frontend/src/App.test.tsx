import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// jest.mock is hoisted above the imports, so App sees the mocked api.
jest.mock('./services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

test('renders the public landing page for an unauthenticated visitor', async () => {
  render(<App />);
  expect(
    await screen.findByRole('heading', {
      name: /ultimate brand-influencer connection platform/i,
    }),
  ).toBeInTheDocument();
});
