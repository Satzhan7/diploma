import React, { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
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
  Flex,
  HStack,
  useColorModeValue,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import Logo from '../components/Logo';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const formBg = useColorModeValue('white', 'gray.700');
  const footerTextColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
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
    <Flex direction="column" minHeight="100vh" bg={bgColor}>
      <Box as="header" py={4} px={{ base: 4, md: 8 }} bg={formBg} boxShadow="sm">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <RouterLink to="/">
              <Logo />
            </RouterLink>
            <HStack spacing={{ base: 2, md: 4 }}>
              <Text fontSize="sm">Already have an account?</Text>
              <Button as={RouterLink} to="/login" colorScheme="blue" size="sm" variant="outline">
                Login
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Flex flex={1} align="center" justify="center" py={12} px={4}>
        <Box 
          maxW="md" 
          w="full" 
          bg={formBg}
          boxShadow="xl"
          rounded="lg"
          p={8}
        >
          <VStack spacing={6} align="stretch">
            <Heading size="lg" textAlign="center">Create an account</Heading>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input 
                    type="text" 
                    name="name" 
                    placeholder="Enter your name or brand name" 
                    bg={bgColor}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input 
                    type="email" 
                    name="email" 
                    placeholder="Enter your email" 
                    bg={bgColor}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input 
                    type="password" 
                    name="password" 
                    placeholder="Enter your password" 
                    bg={bgColor}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    name="role" 
                    placeholder="Select your role" 
                    bg={bgColor}
                  >
                    <option value={UserRole.BRAND}>Brand</option>
                    <option value={UserRole.INFLUENCER}>Influencer</option>
                  </Select>
                </FormControl>
                <Button type="submit" colorScheme="blue" size="lg" fontSize="md" isLoading={isLoading} mt={4}>
                  Register
                </Button>
              </Stack>
            </form>
          </VStack>
        </Box>
      </Flex>

      {/* Footer */}
      <Box as="footer" py={6} px={8} mt={10} bg={formBg} borderTopWidth={1}>
        <Text textAlign="center" fontSize="sm" color={footerTextColor}>
          © {new Date().getFullYear()} adPartners. All rights reserved.
        </Text>
      </Box>
    </Flex>
  );
}; 