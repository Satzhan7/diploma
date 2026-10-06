import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

export type PillTone = 'success' | 'warn' | 'verified' | 'neutral' | 'primary' | 'danger';

const TONES: Record<PillTone, { bg: string; color: string }> = {
  success: { bg: 'success.soft', color: 'success' },
  warn: { bg: 'warn.soft', color: 'warn' },
  verified: { bg: 'verified.soft', color: 'verified' },
  neutral: { bg: 'bg.subtle', color: 'fg.muted' },
  primary: { bg: 'primary.soft', color: 'primary.ink' },
  danger: { bg: 'danger.soft', color: 'danger' },
};

interface StatusPillProps extends BoxProps {
  tone?: PillTone;
}

/** Small rounded status label. Colour comes from the tone only. */
export const StatusPill: React.FC<StatusPillProps> = ({ tone = 'neutral', children, ...props }) => (
  <Box
    as="span"
    display="inline-flex"
    alignItems="center"
    h={6}
    px={2}
    borderRadius="full"
    fontSize="xs"
    fontWeight="600"
    whiteSpace="nowrap"
    {...TONES[tone]}
    {...props}
  >
    {children}
  </Box>
);
