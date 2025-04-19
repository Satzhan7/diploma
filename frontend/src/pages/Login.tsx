import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
  Heading,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await login(email, password);
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate(`/dashboard/${response.user.role.toLowerCase()}`);
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <VStack spacing="8">
        <VStack spacing="6" align="stretch">
          <Heading size="lg">Sign in to your account</Heading>
          <form onSubmit={handleSubmit}>
            <Stack spacing="6">
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" name="email" placeholder="Enter your email" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input type="password" name="password" placeholder="Enter your password" />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={isLoading}>
                Sign in
              </Button>
            </Stack>
          </form>
        </VStack>
        <Text>
          Don't have an account?{' '}
          <RouterLink to="/register">
            <Text as="span" color="blue.500">
              Register
            </Text>
          </RouterLink>
        </Text>
      </VStack>
    </Container>
  );
}; 