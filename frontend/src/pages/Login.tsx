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
  VStack,
  Heading,
  Container,
  Flex,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getErrorMessage } from '../i18n/errors';

export const Login: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();
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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      toast({
        title: t('toast.loginSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: t('errors.loginFailed'),
        description: getErrorMessage(error),
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
              <Text fontSize="sm" display={{ base: 'none', sm: 'block' }}>{t('header.noAccount')}</Text>
              <Button as={RouterLink} to="/register" colorScheme="brand" size="sm" variant="outline">
                {t('header.signUp')}
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
            <Flex justify="flex-end">
              <LanguageSwitcher />
            </Flex>
            <Heading size="lg" textAlign="center">{t('login.title')}</Heading>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>{t('form.emailLabel')}</FormLabel>
                  <Input 
                    type="email" 
                    name="email" 
                    placeholder={t('form.emailPlaceholder')} 
                    bg={bgColor}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>{t('form.passwordLabel')}</FormLabel>
                  <Input 
                    type="password" 
                    name="password" 
                    placeholder={t('form.passwordPlaceholder')} 
                    bg={bgColor}
                  />
                </FormControl>
                <Button type="submit" colorScheme="brand" size="lg" fontSize="md" isLoading={isLoading} mt={4}>
                  {t('login.submit')}
                </Button>
              </Stack>
            </form>
          </VStack>
        </Box>
      </Flex>

      {/* Footer */}
      <Box as="footer" py={6} px={8} mt={10} bg={formBg} borderTopWidth={1}>
        <Text textAlign="center" fontSize="sm" color={footerTextColor}>
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </Text>
      </Box>
    </Flex>
  );
}; 