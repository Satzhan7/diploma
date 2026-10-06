import React from 'react';
import { Box, Button, Code, Flex, HStack, Input, Select, Stack, Text, Wrap } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiList, FiPlus } from 'react-icons/fi';
import ColorModeToggle from '../../components/ColorModeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import {
  BriefCard,
  PageContainer,
  PageHeader,
  PillTone,
  ResponsiveGrid,
  Section,
  StatCard,
  StatusPill,
  VerifiedBadge,
} from '../../components/ui';

// Dev-only reference of the design tokens (docs/PROJECT.md §7). The route exists only when
// import.meta.env.DEV, so this chunk never ships. Labels are token names, not product copy;
// sample text reuses existing translations.

const TYPE = [
  ['display', '40 → 56 / 1.08 / 700'],
  ['h1', '28 → 32 / 1.2 / 700'],
  ['h2', '22 → 24 / 1.25 / 700'],
  ['h3', '18 → 20 / 1.3 / 600'],
  ['lead', '18 / 1.55'],
  ['body', '16 / 1.5'],
  ['small', '14 / 1.43'],
  ['label', '14 / 1.43 / 600'],
  ['caption', '12 / 1.33 / 500'],
] as const;
const SPACE = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20];
const CONTAINERS = ['narrow', 'default', 'wide'] as const;
const TONES: PillTone[] = ['neutral', 'primary', 'success', 'verified', 'warn', 'danger'];
const RADII = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];

const Token: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Code bg="bg.subtle" color="fg.muted" fontSize="xs" px={1.5} borderRadius="sm">
    {children}
  </Code>
);

export const DesignSystem: React.FC = () => {
  const { t } = useTranslation(['landing', 'briefs']);
  const sample = t('landing:hero.text');

  return (
    <Box px={{ base: 4, md: 6, lg: 8 }} py={8}>
      <PageContainer size="wide">
        <PageHeader
          title="Design system"
          subtitle={<Token>theme.ts · docs/PROJECT.md §7</Token>}
          actions={
            <HStack>
              <LanguageSwitcher />
              <ColorModeToggle />
            </HStack>
          }
        />

        <Section title="Type">
          <Stack spacing={4} layerStyle="card" p={{ base: 4, md: 6 }}>
            {TYPE.map(([style, spec]) => (
              <Flex key={style} gap={4} direction={{ base: 'column', md: 'row' }} align={{ md: 'baseline' }}>
                <Box w={{ md: 48 }} flexShrink={0}>
                  <Token>{style}</Token>{' '}
                  <Text as="span" textStyle="caption" color="fg.muted">
                    {spec}
                  </Text>
                </Box>
                <Text textStyle={style} noOfLines={2}>
                  {style === 'body' || style === 'small' || style === 'lead' ? sample : t('landing:hero.title')}
                </Text>
              </Flex>
            ))}
          </Stack>
        </Section>

        <Section title="Spacing">
          <Stack spacing={2} layerStyle="card" p={{ base: 4, md: 6 }}>
            {SPACE.map((n) => (
              <HStack key={n} spacing={4}>
                <Box w={16}>
                  <Token>{`${n} · ${n * 4}`}</Token>
                </Box>
                <Box h={3} w={n} bg="primary" borderRadius="sm" />
              </HStack>
            ))}
          </Stack>
        </Section>

        <Section title="Containers">
          <Stack spacing={3}>
            {CONTAINERS.map((size) => (
              <Box
                key={size}
                maxW={`container.${size}`}
                bg="primary.soft"
                color="primary.ink"
                borderRadius="md"
                px={4}
                py={2}
              >
                <Token>{`container.${size}`}</Token>
              </Box>
            ))}
          </Stack>
        </Section>

        <Section title="Controls">
          <Stack spacing={4} layerStyle="card" p={{ base: 4, md: 6 }}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <Wrap key={size} spacing={3} align="center">
                <Box w={16}>
                  <Token>{size}</Token>
                </Box>
                <Button size={size} leftIcon={<FiPlus />}>
                  {t('briefs:wizard.titleNew')}
                </Button>
                <Button size={size} variant="outline">
                  {t('briefs:feed.view')}
                </Button>
                <Input size={size} w={{ base: 'full', sm: 56 }} placeholder={t('briefs:feed.title')} />
                <Select size={size} w={{ base: 'full', sm: 40 }}>
                  <option>Almaty</option>
                </Select>
              </Wrap>
            ))}
          </Stack>
        </Section>

        <Section title="Cards">
          <Stack spacing={4}>
            <ResponsiveGrid min="kpi">
              <StatCard icon={FiList} label={t('briefs:feed.title')} value={12} />
              <StatCard icon={FiList} label={t('briefs:feed.title')} value={3} helpText="+2" />
              <StatCard icon={FiList} label={t('briefs:feed.title')} value={48} />
              <StatCard icon={FiList} label={t('briefs:feed.title')} value={7} />
            </ResponsiveGrid>
            <ResponsiveGrid>
              {[1, 2, 3].map((i) => (
                <BriefCard
                  key={i}
                  partyName="Coffee Lab Almaty"
                  partyCaption="Almaty · Food"
                  badge={<StatusPill tone="success">open</StatusPill>}
                  title={t('landing:hero.title')}
                  chips={['Instagram', 'Reels', 'Stories']}
                  amount="60 000 – 120 000 ₸"
                  amountCaption="12.10.2026"
                />
              ))}
            </ResponsiveGrid>
          </Stack>
        </Section>

        <Section title="Pills and radii">
          <Stack spacing={4} layerStyle="card" p={{ base: 4, md: 6 }}>
            <Wrap spacing={2}>
              {TONES.map((tone) => (
                <StatusPill key={tone} tone={tone}>
                  {tone}
                </StatusPill>
              ))}
              <VerifiedBadge />
            </Wrap>
            <Wrap spacing={3}>
              {RADII.map((r) => (
                <Flex
                  key={r}
                  boxSize={16}
                  borderRadius={r}
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderColor="border.default"
                  align="center"
                  justify="center"
                >
                  <Token>{r}</Token>
                </Flex>
              ))}
              <Box layerStyle="glass" borderRadius="2xl" px={4} py={3}>
                <Token>glass</Token>
              </Box>
            </Wrap>
          </Stack>
        </Section>
      </PageContainer>
    </Box>
  );
};
