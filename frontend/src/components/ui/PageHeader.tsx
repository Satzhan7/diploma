import React from 'react';
import { Flex, Box, Heading, Text } from '@chakra-ui/react';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Small line above the title, e.g. a back link. */
  eyebrow?: React.ReactNode;
}

// Standard page header: the page's single h1 (`h1` text style) + optional subtitle and actions.
// Spacing below it comes from PageContainer.
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, eyebrow }) => (
  <Flex
    justify="space-between"
    align={{ base: 'flex-start', md: 'flex-end' }}
    direction={{ base: 'column', md: 'row' }}
    gap={4}
  >
    <Box minW={0}>
      {eyebrow && <Box mb={2}>{eyebrow}</Box>}
      <Heading as="h1" textStyle="h1">
        {title}
      </Heading>
      {subtitle && (
        <Text color="fg.muted" mt={2} maxW="container.prose">
          {subtitle}
        </Text>
      )}
    </Box>
    {actions && (
      <Flex gap={3} wrap="wrap" flexShrink={0}>
        {actions}
      </Flex>
    )}
  </Flex>
);
