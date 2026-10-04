import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface ScoreRingProps extends BoxProps {
  /** 0–100. */
  value: number;
  size?: number;
  label?: string;
}

/** Match score as a ring with the number in the middle. */
export const ScoreRing: React.FC<ScoreRingProps> = ({ value, size = 48, label, ...props }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <Box
      role="img"
      aria-label={label ?? `${pct}%`}
      w={`${size}px`}
      h={`${size}px`}
      flex="none"
      borderRadius="full"
      display="grid"
      placeItems="center"
      background={`conic-gradient(var(--ap-primary) ${pct}%, var(--ap-subtle) 0)`}
      {...props}
    >
      <Box
        w={`${size - 10}px`}
        h={`${size - 10}px`}
        borderRadius="full"
        bg="bg.surface"
        display="grid"
        placeItems="center"
        fontWeight="700"
        fontSize={size >= 48 ? 'sm' : 'xs'}
        sx={{ fontVariantNumeric: 'tabular-nums' }}
        aria-hidden
      >
        {pct}
      </Box>
    </Box>
  );
};
