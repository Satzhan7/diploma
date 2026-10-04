import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Flex, Heading, HStack, Link, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { ScoreRing, VerifiedBadge } from '../components/ui';
import { formatNumber, formatPercent } from '../i18n';

// Illustration only: the hero shows what an applicant list looks like.
const EXAMPLE_APPLICANTS = [
  { name: 'Dana Serikbay', followers: 24100, er: 0.068, match: 92, verified: true, shift: '0px' },
  { name: 'Arman Tolegen', followers: 41000, er: 0.042, match: 87, verified: true, shift: '28px' },
  { name: 'Aruzhan Bekova', followers: 12600, er: 0.079, match: 84, verified: false, shift: '10px' },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

const STEPS = ['post', 'apply', 'deal'] as const;

const Landing: React.FC = () => {
  const { t } = useTranslation('landing');
  const padX = { base: 4, md: 10 };

  return (
    <Flex direction="column" minH="100vh">
      <Flex as="header" align="center" justify="space-between" gap={4} px={padX} py={5}>
        <RouterLink to="/" aria-label="AdPartners.kz">
          <Logo sx={{ svg: { height: '30px', width: 'auto' } }} />
        </RouterLink>
        <HStack spacing={{ base: 3, md: 5 }} fontSize="sm" fontWeight="500">
          <Link
            as={RouterLink}
            to="/register?role=influencer"
            color="fg.muted"
            display={{ base: 'none', md: 'inline' }}
          >
            {t('nav.forCreators')}
          </Link>
          <LanguageSwitcher display={{ base: 'none', sm: 'flex' }} />
          <Link as={RouterLink} to="/login" fontWeight="600">
            {t('nav.logIn')}
          </Link>
        </HStack>
      </Flex>

      <Flex
        as="main"
        wrap="wrap"
        gap={12}
        align="center"
        px={padX}
        pt={{ base: 6, md: 14 }}
        pb={{ base: 10, md: 16 }}
      >
        <Stack flex="1 1 420px" minW={0} spacing={5}>
          <Text fontSize="sm" fontWeight="600" color="primary.ink">
            {t('hero.eyebrow')}
          </Text>
          <Heading as="h1" textStyle="display" fontSize={{ base: '38px', md: '64px' }} lineHeight="1.04" sx={{ textWrap: 'balance' }}>
            {t('hero.title')}
          </Heading>
          <Text fontSize="lg" lineHeight="1.55" color="fg.muted" maxW="520px">
            {t('hero.text')}
          </Text>
          <Flex wrap="wrap" gap={3}>
            <Button as={RouterLink} to="/register?role=brand" size="lg" h="52px" px={6}>
              {t('hero.ctaBrand')}
            </Button>
            <Button
              as={RouterLink}
              to="/register?role=influencer"
              size="lg"
              h="52px"
              px={6}
              variant="outline"
              colorScheme="gray"
              bg="bg.surface"
              borderColor="border.default"
            >
              {t('hero.ctaCreator')}
            </Button>
          </Flex>
          <Text fontSize="sm" color="fg.muted">
            {t('hero.note')}
          </Text>
        </Stack>

        <Stack flex="1 1 360px" minW={0} spacing={2.5} aria-label={t('example.label')} role="figure">
          <Flex justify="space-between" fontSize="sm" color="fg.muted" gap={3}>
            <Text>
              {t('example.label')} · {t('example.title')}
            </Text>
            <Text whiteSpace="nowrap">{t('example.meta')}</Text>
          </Flex>
          {EXAMPLE_APPLICANTS.map((a) => (
            <Flex
              key={a.name}
              align="center"
              gap={3.5}
              p={3.5}
              layerStyle="card"
              transform={{ base: 'none', md: `translateX(${a.shift})` }}
            >
              <Box
                w="52px"
                h="52px"
                flex="none"
                borderRadius="full"
                borderWidth="1px"
                borderColor="border.default"
                bg="bg.subtle"
                display="grid"
                placeItems="center"
                fontWeight="700"
                color="fg.muted"
                aria-hidden
              >
                {initials(a.name)}
              </Box>
              <Box flex={1} minW={0}>
                <Flex align="center" gap={2} wrap="wrap">
                  <Text fontWeight="600">{a.name}</Text>
                  {a.verified && <VerifiedBadge />}
                </Flex>
                <Text fontSize="sm" color="fg.muted">
                  {formatNumber(a.followers)} · {t('example.er', { value: formatPercent(a.er) })} · {t('example.city')}
                </Text>
              </Box>
              <ScoreRing value={a.match} label={t('example.match', { value: a.match })} />
            </Flex>
          ))}
        </Stack>
      </Flex>

      <Box as="section" aria-label={t('steps.label')}>
        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          gap="1px"
          bg="border.default"
          borderTopWidth="1px"
          borderBottomWidth="1px"
          borderColor="border.default"
        >
          {STEPS.map((key, i) => (
            <Stack key={key} bg="bg.canvas" px={padX} py={7} spacing={2}>
              <Text textStyle="display" fontSize="36px" color="primary.ink" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Heading as="h2" fontSize="17px" fontWeight="600" letterSpacing="normal">
                {t(`steps.${key}.title`)}
              </Heading>
              <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                {t(`steps.${key}.text`)}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Box>

      <Flex as="footer" justify="space-between" wrap="wrap" gap={3} px={padX} py={6} fontSize="sm" color="fg.muted" mt="auto">
        <Text>{t('footer.copyright', { year: new Date().getFullYear() })}</Text>
        <LanguageSwitcher display={{ base: 'flex', sm: 'none' }} />
      </Flex>
    </Flex>
  );
};

export default Landing;
