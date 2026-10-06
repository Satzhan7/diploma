import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
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
  useToast,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiCheck } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { Plan as PlanName, PlanInfo, planService } from '../../services/plan';
import { formatDate, formatMoney } from '../../i18n';
import { getErrorMessage } from '../../i18n/errors';
import { PageHeader, StatusPill, PageContainer } from '../../components/ui';

const FEATURES: Record<PlanName, string[]> = {
  free: ['briefs', 'ranked', 'deals'],
  pro: ['everything', 'verified'],
};

/**
 * `/brand/plan`: Free vs Pro. In the test period Pro comes from a 0 ₸ checkout;
 * after it, from a Kaspi transfer that an admin confirms.
 */
export const Plan: React.FC = () => {
  const { t } = useTranslation('plan');
  const plan = useQuery({ queryKey: ['plan', 'me'], queryFn: planService.mine });

  return (
    <PageContainer>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {plan.isPending ? (
        <Skeleton h={80} borderRadius="xl" />
      ) : plan.isError ? (
        <Text color="danger">{getErrorMessage(plan.error)}</Text>
      ) : (
        <PlanBody info={plan.data} />
      )}
    </PageContainer>
  );
};

const PlanBody: React.FC<{ info: PlanInfo }> = ({ info }) => {
  const { t } = useTranslation('plan');
  const toast = useToast();
  const queryClient = useQueryClient();
  const expired = info.storedPlan === 'pro' && info.proExpiresAt && new Date(info.proExpiresAt).getTime() <= Date.now();
  const inTest = info.checkoutPriceKzt !== null;
  const checkout = useMutation({
    mutationFn: planService.checkout,
    onSuccess: (next) => {
      queryClient.setQueryData(['plan', 'me'], next);
      toast({
        status: 'success',
        title: t('checkout.done', { date: next.proExpiresAt ? formatDate(next.proExpiresAt) : '' }),
      });
    },
    onError: (error) => toast({ status: 'error', title: getErrorMessage(error) }),
    // Everything that read the old plan: the Applicants toggle and its refused queries.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });

  return (
    <Stack spacing={6}>
      {info.freeTestPeriod && (
        <Alert status="success" borderRadius="lg" role="status">
          <AlertIcon />
          <AlertDescription>
            <StatusPill tone="success" mr={2}>
              {t('testBadge')}
            </StatusPill>
            {t('testNote', { price: formatMoney(info.checkoutPriceKzt ?? 0) })}
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
                <Heading id={`plan-${name}`} as="h2" textStyle="h3">
                  {t(`${name}.name`)}
                </Heading>
                {current && <StatusPill tone="primary">{t('currentBadge')}</StatusPill>}
              </HStack>
              <Box>
                <Text as="span" textStyle="display" fontSize="3xl" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(name === 'pro' ? (info.checkoutPriceKzt ?? info.priceKzt) : 0)}
                </Text>{' '}
                {name === 'pro' && !inTest && (
                  <Text as="span" color="fg.muted">
                    {t('perMonth')}
                  </Text>
                )}
                {name === 'pro' && inTest && (
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    {t('pro.afterTest', { price: formatMoney(info.priceKzt) })}
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
              {name === 'pro' && current && (
                <Text fontSize="sm" color="fg.muted">
                  {info.proExpiresAt ? t('until', { date: formatDate(info.proExpiresAt) }) : t('noEnd')}
                </Text>
              )}
              {name === 'pro' && expired && (
                <Text fontSize="sm" color="warn">
                  {t('expired', { date: formatDate(info.proExpiresAt!) })}
                </Text>
              )}
              {name === 'pro' && inTest && !current && (
                <Button
                  colorScheme="brand"
                  alignSelf="flex-start"
                  isLoading={checkout.isPending}
                  onClick={() => checkout.mutate()}
                >
                  {t('checkout.button', { price: formatMoney(info.checkoutPriceKzt ?? 0) })}
                </Button>
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
      <Heading id="plan-pay" as="h2" textStyle="h3">
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
