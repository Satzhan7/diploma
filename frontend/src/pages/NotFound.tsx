import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Heading, Text, VStack } from '@chakra-ui/react';
import { PageContainer } from '../components/ui';

import { useTranslation } from 'react-i18next';

export const NotFound: React.FC = () => {
  const { t } = useTranslation('auth');

  return (
    <PageContainer size="narrow" py={{ base: 12, md: 24 }} px={4}>
      <VStack spacing="8" align="center" textAlign="center">
        <Heading as="h1" textStyle="display">
          404
        </Heading>
        <Text textStyle="h3">{t('notFound.title')}</Text>
        <Text>{t('notFound.description')}</Text>
        <Button as={RouterLink} to="/" colorScheme="brand">
          {t('notFound.goHome')}
        </Button>
      </VStack>
    </PageContainer>
  );
};
