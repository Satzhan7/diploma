import React from 'react';
import { VStack, Box, Heading, Text } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { IconWrapper } from '../IconWrapper';

interface EmptyStateProps {
  icon?: IconType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// Empty collection state: icon-in-circle, title, muted description, optional CTA.
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <VStack spacing={4} py={16} px={6} textAlign="center">
    {icon && (
      <Box bg="bg.subtle" color="fg.subtle" borderRadius="full" p={4} display="inline-flex">
        <IconWrapper icon={icon} size="1.75em" />
      </Box>
    )}
    <Heading as="h2" size="md" fontWeight="600">
      {title}
    </Heading>
    {description && (
      <Text color="fg.muted" maxW="sm">
        {description}
      </Text>
    )}
    {action && <Box pt={2}>{action}</Box>}
  </VStack>
);
