import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('./services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import App from './App';

test('renders the public landing page for an unauthenticated visitor', async () => {
  render(<App />);
  expect(
    await screen.findByRole('heading', {
      name: /ultimate brand-influencer connection platform/i,
    }),
  ).toBeInTheDocument();
});
