import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { SegmentedControl } from '../components/ui';
import { getErrorMessage, getFieldErrors } from '../i18n/errors';

type Mode = 'login' | 'register';
type SignupRole = UserRole.BRAND | UserRole.INFLUENCER;

const ROLES: SignupRole[] = [UserRole.BRAND, UserRole.INFLUENCER];

export const Auth: React.FC<{ mode: Mode }> = ({ mode }) => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register } = useAuth();
  const isRegister = mode === 'register';

  const [role, setRole] = useState<SignupRole>(
    params.get('role') === UserRole.INFLUENCER ? UserRole.INFLUENCER : UserRole.BRAND,
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    navigate(next === 'register' ? `/register?role=${role}` : '/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      if (isRegister) {
        await register({ name: name.trim(), email: email.trim(), password, role });
      }
      await login(email.trim(), password);
      navigate('/');
    } catch (error) {
      const fields = getFieldErrors(error);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) {
        setFormError(getErrorMessage(error, t(isRegister ? 'errors.registerFailed' : 'errors.loginFailed')));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex minH="100vh" wrap="wrap">
      <Stack
        as="main"
        flex="1 1 360px"
        minW={0}
        justify="center"
        spacing={6}
        px={{ base: 5, md: 14 }}
        py={{ base: 7, md: 12 }}
      >
        <Flex justify="space-between" align="center" gap={3}>
          <RouterLink to="/" aria-label="AdPartners.kz">
            <Logo sx={{ svg: { height: '28px', width: 'auto' } }} />
          </RouterLink>
          <LanguageSwitcher />
        </Flex>

        <Box maxW="440px" w="full">
          <Stack spacing={6}>
            <Heading as="h1" textStyle="display" fontSize="34px">
              {t(isRegister ? 'register.title' : 'login.title')}
            </Heading>

            <SegmentedControl<Mode>
              label={t('tabs.label')}
              value={mode}
              onChange={switchMode}
              segments={[
                { value: 'register', label: t('tabs.signUp') },
                { value: 'login', label: t('tabs.logIn') },
              ]}
            />

            <form onSubmit={handleSubmit} noValidate>
              <Stack spacing={4}>
                {isRegister && (
                  <SimpleGrid columns={2} spacing={2.5} role="radiogroup" aria-label={t('role.label')}>
                    {ROLES.map((r) => {
                      const on = role === r;
                      return (
                        <Box
                          key={r}
                          as="button"
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setRole(r)}
                          textAlign="left"
                          p={3.5}
                          borderRadius="xl"
                          borderWidth="2px"
                          borderColor={on ? 'primary' : 'border.default'}
                          bg={on ? 'primary.soft' : 'bg.surface'}
                        >
                          <Text fontWeight="700" fontSize="15px">
                            {t(`role.${r}.title`)}
                          </Text>
                          <Text fontSize="13px" color="fg.muted" lineHeight="1.4" mt={1}>
                            {t(`role.${r}.text`)}
                          </Text>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                )}

                {isRegister && (
                  <FormControl isRequired isInvalid={!!fieldErrors.name}>
                    <FormLabel fontSize="sm">{t(role === UserRole.BRAND ? 'form.brandName' : 'form.creatorName')}</FormLabel>
                    <Input
                      name="name"
                      autoComplete={role === UserRole.BRAND ? 'organization' : 'name'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      bg="bg.surface"
                      h="46px"
                    />
                    <FormErrorMessage>{fieldErrors.name}</FormErrorMessage>
                  </FormControl>
                )}

                <FormControl isRequired isInvalid={!!fieldErrors.email}>
                  <FormLabel fontSize="sm">{t('form.email')}</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder={t('form.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="bg.surface"
                    h="46px"
                  />
                  <FormErrorMessage>{fieldErrors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!fieldErrors.password}>
                  <FormLabel fontSize="sm">{t('form.password')}</FormLabel>
                  <Input
                    type="password"
                    name="password"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="bg.surface"
                    h="46px"
                  />
                  {fieldErrors.password ? (
                    <FormErrorMessage>{fieldErrors.password}</FormErrorMessage>
                  ) : (
                    isRegister && <FormHelperText>{t('form.passwordHint')}</FormHelperText>
                  )}
                </FormControl>

                {formError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {formError}
                  </Alert>
                )}

                <Button type="submit" size="lg" h="50px" isLoading={isSubmitting}>
                  {t(isRegister ? 'register.submit' : 'login.submit')}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Box>
      </Stack>

      <Box
        display={{ base: 'none', md: 'flex' }}
        flex="1 1 340px"
        minW={0}
        minH="100vh"
        position="relative"
        alignItems="flex-end"
        p={10}
        borderLeftWidth="1px"
        borderColor="border.default"
        overflow="hidden"
      >
        <Image
          src="/images/welcome.jpg"
          alt={t('panel.imageAlt')}
          position="absolute"
          inset={0}
          w="full"
          h="full"
          objectFit="cover"
        />
        <Stack position="relative" layerStyle="glass" borderRadius="xl" p={5} spacing={1.5} maxW="320px">
          <Text fontSize="sm" color="fg.muted">
            {t('panel.label')}
          </Text>
          <Text textStyle="display" fontSize="24px">
            {t('panel.text')}
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default Auth;
