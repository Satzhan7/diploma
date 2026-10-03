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
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';

export const Register: React.FC = () => {
  const { t } = useTranslation('auth');
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
        title: t('toast.registerSuccess'),
        description: t('toast.registerSuccessDescription'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: t('errors.registerFailed'),
        description:
          error?.response?.data?.message ||
          (error instanceof Error ? error.message : t('errors.generic')),
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
              <Text fontSize="sm" display={{ base: 'none', sm: 'block' }}>{t('header.haveAccount')}</Text>
              <Button as={RouterLink} to="/login" colorScheme="brand" size="sm" variant="outline">
                {t('header.login')}
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
            <Heading size="lg" textAlign="center">{t('register.title')}</Heading>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>{t('form.nameLabel')}</FormLabel>
                  <Input 
                    type="text" 
                    name="name" 
                    placeholder={t('form.namePlaceholder')} 
                    bg={bgColor}
                  />
                </FormControl>
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
                <FormControl isRequired>
                  <FormLabel>{t('form.roleLabel')}</FormLabel>
                  <Select 
                    name="role" 
                    placeholder={t('form.rolePlaceholder')} 
                    bg={bgColor}
                  >
                    <option value={UserRole.BRAND}>{t('common:role.brand')}</option>
                    <option value={UserRole.INFLUENCER}>{t('common:role.influencer')}</option>
                  </Select>
                </FormControl>
                <Button type="submit" colorScheme="brand" size="lg" fontSize="md" isLoading={isLoading} mt={4}>
                  {t('register.submit')}
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