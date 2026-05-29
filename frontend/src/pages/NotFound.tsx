import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Heading, Text, VStack, Container } from '@chakra-ui/react';

export const NotFound: React.FC = () => {
  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <VStack spacing="8" align="center">
        <Heading size="2xl">404</Heading>
        <Text fontSize="xl">Page not found</Text>
        <Text>The page you are looking for does not exist or has been moved.</Text>
        <Button as={RouterLink} to="/" colorScheme="blue">
          Go back home
        </Button>
      </VStack>
    </Container>
  );
}; 