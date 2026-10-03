import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Heading, Text, VStack, Container } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export const NotFound: React.FC = () => {
  const { t } = useTranslation('auth');

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <VStack spacing="8" align="center">
        <Heading size="2xl">404</Heading>
        <Text fontSize="xl">{t('notFound.title')}</Text>
        <Text>{t('notFound.description')}</Text>
        <Button as={RouterLink} to="/" colorScheme="brand">
          {t('notFound.goHome')}
        </Button>
      </VStack>
    </Container>
  );
};
