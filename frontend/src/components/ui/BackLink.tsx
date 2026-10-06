import React from 'react';
import { Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

// "← Parent" link above a page header; a 32 px tall target (WCAG 2.5.8 needs 24).
export const BackLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link
    as={RouterLink}
    to={to}
    textStyle="small"
    color="fg.muted"
    display="inline-flex"
    alignSelf="flex-start"
    alignItems="center"
    gap={1}
    minH="control.sm"
    pr={2}
  >
    <FiArrowLeft aria-hidden /> {children}
  </Link>
);
