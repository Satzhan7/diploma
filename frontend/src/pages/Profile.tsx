import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Avatar,
  Card,
  CardBody,
  Stack,
  StackDivider,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  if (!user) {
    return null;
  }

  return (
    <Container maxW="container.md" py={{ base: '24', md: '32' }}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Avatar size="2xl" name={user.name} mb={4} />
          <Heading size="lg">{user.name}</Heading>
          <Text color="gray.500">{user.role}</Text>
        </Box>

        <Card>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Email
                </Text>
                <Text fontSize="md">{user.email}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Account Type
                </Text>
                <Text fontSize="md" textTransform="capitalize">
                  {user.role}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Member Since
                </Text>
                <Text fontSize="md">
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </Box>
            </Stack>
          </CardBody>
        </Card>

        <Button
          colorScheme="blue"
          onClick={() =>
            toast({
              title: 'Coming Soon',
              description: 'Profile editing will be available soon!',
              status: 'info',
              duration: 3000,
              isClosable: true,
            })
          }
        >
          Edit Profile
        </Button>
      </VStack>
    </Container>
  );
}; 