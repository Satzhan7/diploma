import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../../theme';
import { CreatorCard } from './CreatorCard';

const card = (images?: { src: string; alt: string }[]) =>
  render(
    <ChakraProvider theme={theme}>
      <CreatorCard
        name="Aruzhan"
        score={80}
        scoreLabel="Match 80"
        stats={[]}
        price="₸60 000"
        stripLabel={images ? 'Work samples by Aruzhan' : 'Samples appear here'}
        images={images}
      />
    </ChakraProvider>,
  );

describe('CreatorCard content strip', () => {
  it('shows up to three portfolio images with their alt text', () => {
    card([1, 2, 3, 4].map((n) => ({ src: `https://api.test/files/${n}`, alt: `Work sample ${n} by Aruzhan` })));
    const strip = screen.getByRole('list', { name: 'Work samples by Aruzhan' });
    expect(strip.querySelectorAll('img')).toHaveLength(3);
    expect(screen.getByAltText('Work sample 1 by Aruzhan')).toHaveAttribute('src', 'https://api.test/files/1');
  });

  it('shows placeholders without a portfolio', () => {
    card();
    expect(screen.getByRole('img', { name: 'Samples appear here' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
