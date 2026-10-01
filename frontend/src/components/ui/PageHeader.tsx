import React from 'react';
import { Flex, Box, Heading, Text } from '@chakra-ui/react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

// Standard page header: single h1 per page + optional subtitle and actions.
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <Flex
    justify="space-between"
    align={{ base: 'flex-start', md: 'center' }}
    direction={{ base: 'column', md: 'row' }}
    gap={4}
    mb={8}
  >
    <Box>
      <Heading as="h1" size={{ base: 'lg', md: 'xl' }} fontWeight="700">
        {title}
      </Heading>
      {subtitle && (
        <Text color="fg.muted" mt={1}>
          {subtitle}
        </Text>
      )}
    </Box>
    {actions && <Flex gap={3}>{actions}</Flex>}
  </Flex>
);
