import React, { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useToast,
  Select,
  VStack,
  Heading,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as UserRole,
    };

    try {
      await register(data);
      toast({
        title: 'Registration successful',
        description: 'Please login with your credentials',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <VStack spacing="8">
        <VStack spacing="6" align="stretch">
          <Heading size="lg">Create an account</Heading>
          <form onSubmit={handleSubmit}>
            <Stack spacing="6">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input type="text" name="name" placeholder="Enter your name" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" name="email" placeholder="Enter your email" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input type="password" name="password" placeholder="Enter your password" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select name="role" placeholder="Select your role">
                  <option value={UserRole.BRAND}>Brand</option>
                  <option value={UserRole.INFLUENCER}>Influencer</option>
                </Select>
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={isLoading}>
                Register
              </Button>
            </Stack>
          </form>
        </VStack>
        <Text>
          Already have an account?{' '}
          <RouterLink to="/login">
            <Text as="span" color="blue.500">
              Sign in
            </Text>
          </RouterLink>
        </Text>
      </VStack>
    </Container>
  );
}; 