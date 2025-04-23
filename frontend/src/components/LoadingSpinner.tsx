import React from 'react';
import { Spinner, Center, Text, VStack } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <Center p={10}>
      <VStack>
        <Spinner size="xl" />
        <Text mt={3}>{message}</Text>
      </VStack>
    </Center>
  );
};

export default LoadingSpinner; 