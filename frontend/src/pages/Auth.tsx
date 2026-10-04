import React, { useEffect, useId, useState } from 'react';
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
  HStack,
  Image,
  Input,
  PinInput,
  PinInputField,
  SimpleGrid,
  Stack,
  Text,
  useRadio,
  useRadioGroup,
  UseRadioProps,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { SegmentedControl } from '../components/ui';
import { getErrorCode, getErrorMessage, getFieldErrors } from '../i18n/errors';

type Mode = 'login' | 'register';
type SignupRole = UserRole.BRAND | UserRole.INFLUENCER;

const ROLES: SignupRole[] = [UserRole.BRAND, UserRole.INFLUENCER];
/** Fields that have an input on this page; other field errors go to the form alert. */
const FIELDS = ['name', 'email', 'password'];

/**
 * Card-styled native radio: arrow keys and focus work like any radio group.
 * Chakra marks the visual box aria-hidden, so the input is named by id references.
 */
const RoleCard: React.FC<UseRadioProps & { title: string; text: string }> = ({ title, text, ...radioProps }) => {
  const id = useId();
  const { getInputProps, getRadioProps, getLabelProps } = useRadio({
    ...radioProps,
    'aria-describedby': `${id}-text`,
  });
  return (
    <Box as="label" cursor="pointer" {...getLabelProps()}>
      <input {...getInputProps({ 'aria-labelledby': `${id}-title` })} />
      <Box
        {...getRadioProps()}
        h="full"
        p={3.5}
        borderRadius="xl"
        borderWidth="2px"
        borderColor="border.default"
        bg="bg.surface"
        _checked={{ borderColor: 'primary', bg: 'primary.soft' }}
        _focusVisible={{
          outline: '3px solid var(--ap-primary)',
          outlineOffset: '2px',
        }}
      >
        <Text id={`${id}-title`} fontWeight="700" fontSize="15px">
          {title}
        </Text>
        <Text id={`${id}-text`} fontSize="13px" color="fg.muted" lineHeight="1.4" mt={1}>
          {text}
        </Text>
      </Box>
    </Box>
  );
};

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

/** Second sign-up step: the 6-digit code from the email (paste, auto-advance, resend timer). */
const CodeStep: React.FC<{ email: string; password: string; onChangeEmail: () => void }> = ({
  email,
  password,
  onChangeEmail,
}) => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { verifyEmail, resendCode } = useAuth();
  const [code, setCode] = useState('');
  // Remounts the fields after a failed try, so focus returns to the first box.
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const submit = async (value: string) => {
    if (value.length !== CODE_LENGTH || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await verifyEmail(email, value, password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, t('code.failed')));
      setCode('');
      setAttempt((a) => a + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    setError(null);
    setNotice(null);
    try {
      await resendCode(email);
      setNotice(t('code.resent'));
      setSecondsLeft(RESEND_SECONDS);
      setCode('');
      setAttempt((a) => a + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(code);
      }}
      noValidate
    >
      <Stack spacing={5}>
        <Text color="fg.muted">{t('code.sent', { email })}</Text>
        <Stack spacing={2}>
          <Text as="span" id="code-label" fontSize="sm" fontWeight="500">
            {t('code.label')}
          </Text>
          <HStack role="group" aria-labelledby="code-label" spacing={{ base: 1.5, sm: 2.5 }}>
            <PinInput
              key={attempt}
              otp
              placeholder=""
              autoFocus
              size="lg"
              value={code}
              onChange={setCode}
              onComplete={submit}
              isInvalid={!!error}
              isDisabled={isSubmitting}
            >
              {Array.from({ length: CODE_LENGTH }, (_, i) => (
                <PinInputField
                  key={i}
                  aria-label={t('code.digit', { n: i + 1 })}
                  bg="bg.surface"
                  h="54px"
                  w={{ base: '44px', sm: '52px' }}
                  fontSize="22px"
                  fontWeight="600"
                />
              ))}
            </PinInput>
          </HStack>
        </Stack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        {notice && (
          <Text role="status" fontSize="sm" color="success">
            {notice}
          </Text>
        )}

        <Button type="submit" size="lg" h="50px" isLoading={isSubmitting} isDisabled={code.length !== CODE_LENGTH}>
          {t('code.submit')}
        </Button>

        <Text fontSize="sm" color="fg.muted">
          {t('code.help')}
        </Text>

        <Flex justify="space-between" wrap="wrap" gap={3} fontSize="sm">
          <Button variant="link" size="sm" onClick={resend} isDisabled={secondsLeft > 0}>
            {secondsLeft > 0 ? t('code.resendIn', { seconds: secondsLeft }) : t('code.resend')}
          </Button>
          <Button variant="link" size="sm" onClick={onChangeEmail}>
            {t('code.changeEmail')}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
};

export const Auth: React.FC<{ mode: Mode }> = ({ mode }) => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register, resendCode } = useAuth();
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
  // Set once a code has been emailed: the page shows the code step.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'role',
    value: role,
    onChange: (value) => setRole(value as SignupRole),
  });

  // /login and /register share this component: errors belong to one mode.
  useEffect(() => {
    setFieldErrors({});
    setFormError(null);
    setPendingEmail(null);
  }, [mode]);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    navigate(next === 'register' ? `/register?role=${role}` : '/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    const address = email.trim();
    try {
      if (isRegister) {
        await register({ name: name.trim(), email: address, password, role });
        setPendingEmail(address);
      } else {
        await login(address, password);
        navigate('/');
      }
    } catch (error) {
      // Right password, unconfirmed email: send a fresh code and ask for it.
      if (!isRegister && getErrorCode(error) === 'AUTH_EMAIL_NOT_VERIFIED') {
        try {
          await resendCode(address);
          setPendingEmail(address);
        } catch (resendError) {
          setFormError(getErrorMessage(resendError));
        }
        return;
      }
      const fields = getFieldErrors(error);
      setFieldErrors(fields);
      if (!Object.keys(fields).some((f) => FIELDS.includes(f))) {
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
              {t(pendingEmail ? 'code.title' : isRegister ? 'register.title' : 'login.title')}
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

            {pendingEmail ? (
              <CodeStep email={pendingEmail} password={password} onChangeEmail={() => setPendingEmail(null)} />
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={4}>
                  {isRegister && (
                    <SimpleGrid columns={2} spacing={2.5} aria-label={t('role.label')} {...getRootProps()}>
                      {ROLES.map((r) => (
                        <RoleCard
                          key={r}
                          title={t(`role.${r}.title`)}
                          text={t(`role.${r}.text`)}
                          {...getRadioProps({ value: r })}
                        />
                      ))}
                    </SimpleGrid>
                  )}

                  {isRegister && (
                    <FormControl isRequired isInvalid={!!fieldErrors.name}>
                      <FormLabel fontSize="sm">
                        {t(role === UserRole.BRAND ? 'form.brandName' : 'form.creatorName')}
                      </FormLabel>
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
            )}
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
