import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Heading,
  HStack,
  List,
  ListIcon,
  ListItem,
  OrderedList,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiCheck } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { Plan as PlanName, PlanInfo, planService } from '../../services/plan';
import { formatDate, formatMoney } from '../../i18n';
import { getErrorMessage } from '../../i18n/errors';
import { PageHeader, StatusPill } from '../../components/ui';

const FEATURES: Record<PlanName, string[]> = {
  free: ['briefs', 'ranked', 'deals'],
  pro: ['everything', 'verified'],
};

/** `/brand/plan`: Free vs Pro. No payment step while the test period is on. */
export const Plan: React.FC = () => {
  const { t } = useTranslation('plan');
  const plan = useQuery({ queryKey: ['plan', 'me'], queryFn: planService.mine });

  return (
    <Stack spacing={6} maxW="880px">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {plan.isPending ? (
        <Skeleton h="320px" borderRadius="xl" />
      ) : plan.isError ? (
        <Text color="danger">{getErrorMessage(plan.error)}</Text>
      ) : (
        <PlanBody info={plan.data} />
      )}
    </Stack>
  );
};

const PlanBody: React.FC<{ info: PlanInfo }> = ({ info }) => {
  const { t } = useTranslation('plan');
  const expired = info.storedPlan === 'pro' && info.proExpiresAt && new Date(info.proExpiresAt).getTime() <= Date.now();

  return (
    <Stack spacing={6}>
      {info.freeTestPeriod && (
        <Alert status="success" borderRadius="lg" role="status">
          <AlertIcon />
          <AlertDescription>
            <StatusPill tone="success" mr={2}>
              {t('testBadge')}
            </StatusPill>
            {t('testNote')}
          </AlertDescription>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {(['free', 'pro'] as const).map((name) => {
          const current = info.plan === name;
          return (
            <Stack
              key={name}
              as="section"
              aria-labelledby={`plan-${name}`}
              layerStyle="card"
              p={{ base: 5, md: 6 }}
              spacing={4}
              borderWidth={current ? '2px' : undefined}
              borderColor={current ? 'primary' : undefined}
            >
              <HStack justify="space-between">
                <Heading id={`plan-${name}`} as="h2" fontSize="xl">
                  {t(`${name}.name`)}
                </Heading>
                {current && <StatusPill tone="primary">{t('currentBadge')}</StatusPill>}
              </HStack>
              <Box>
                <Text as="span" textStyle="display" fontSize="3xl" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {name === 'free' ? t('free.price') : formatMoney(info.priceKzt)}
                </Text>{' '}
                {name === 'pro' && (
                  <Text as="span" color="fg.muted">
                    {t('perMonth')}
                  </Text>
                )}
              </Box>
              <List spacing={2}>
                {FEATURES[name].map((feature) => (
                  <ListItem key={feature} display="flex" alignItems="flex-start">
                    <ListIcon as={FiCheck} color="success" mt={1} aria-hidden />
                    {t(`features.${feature}`)}
                  </ListItem>
                ))}
              </List>
              {name === 'pro' && current && !info.freeTestPeriod && (
                <Text fontSize="sm" color="fg.muted">
                  {info.proExpiresAt ? t('until', { date: formatDate(info.proExpiresAt) }) : t('noEnd')}
                </Text>
              )}
              {name === 'pro' && expired && !info.freeTestPeriod && (
                <Text fontSize="sm" color="warn">
                  {t('expired', { date: formatDate(info.proExpiresAt!) })}
                </Text>
              )}
            </Stack>
          );
        })}
      </SimpleGrid>

      {!info.freeTestPeriod && info.plan !== 'pro' && <PaySteps info={info} />}
    </Stack>
  );
};

/** Kaspi transfer instructions; an admin then sets Pro by hand. */
const PaySteps: React.FC<{ info: PlanInfo }> = ({ info }) => {
  const { t } = useTranslation('plan');
  const { user } = useAuth();
  return (
    <Stack as="section" aria-labelledby="plan-pay" layerStyle="card" p={{ base: 5, md: 6 }} spacing={3}>
      <Heading id="plan-pay" as="h2" fontSize="lg">
        {t('pay.title')}
      </Heading>
      <OrderedList spacing={2} pl={1}>
        <ListItem>{t('pay.s1')}</ListItem>
        <ListItem>
          {info.kaspiPhone
            ? t('pay.s2', {
                price: formatMoney(info.priceKzt),
                phone: info.kaspiPhone,
                recipient: info.kaspiRecipient,
              })
            : t('pay.s2NoPhone')}
        </ListItem>
        <ListItem>{t('pay.s3', { email: user?.email ?? '' })}</ListItem>
        <ListItem>{t('pay.s4')}</ListItem>
      </OrderedList>
    </Stack>
  );
};
