import React, { useState } from 'react';
import { Box, Button, Flex, Grid, HStack, Heading, Link, Skeleton, Stack, Text, useToast } from '@chakra-ui/react';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import { DEAL_STEPS, DEAL_TONE, Deal as DealModel, dealStepIndex, dealsService } from '../services/deals';
import { chatsService } from '../services/chats';
import { formatDate, formatMoney } from '../i18n';
import { getErrorCode, getErrorMessage } from '../i18n/errors';
import { EmptyState, PageContainer, StatusPill, Stepper } from '../components/ui';
import { layout } from '../theme';

const firstName = (name: string) => name.split(' ')[0] || name;

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Flex
    as="li"
    justify="space-between"
    gap={3}
    px={4}
    py={3}
    borderBottomWidth="1px"
    borderColor="border.default"
    fontSize="sm"
  >
    <Text as="span" color="fg.muted">
      {label}
    </Text>
    <Text as="span" fontWeight="600" textAlign="right" overflowWrap="anywhere">
      {children}
    </Text>
  </Flex>
);

export const Deal: React.FC = () => {
  const { t } = useTranslation('deals');
  const { dealId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [opening, setOpening] = useState(false);
  const isBrand = user?.role === UserRole.BRAND;
  const base = isBrand ? '/brand' : '/influencer';

  const {
    data: deal,
    isPending,
    error,
  } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsService.getById(dealId),
    retry: (count, err) => getErrorCode(err) !== 'DEAL_NOT_FOUND' && count < 2,
  });

  if (isPending) {
    return (
      <PageContainer aria-busy="true">
        <Skeleton h={14} borderRadius="md" />
        <Skeleton h={12} borderRadius="md" />
        <Skeleton h={56} borderRadius="xl" />
      </PageContainer>
    );
  }

  if (error || !deal) {
    const notFound = getErrorCode(error) === 'DEAL_NOT_FOUND';
    return (
      <EmptyState
        icon={FiCheckCircle}
        title={notFound ? t('detail.notFound.title') : t('loadError')}
        description={notFound ? t('detail.notFound.description') : undefined}
        action={
          <Button as={RouterLink} to={`${base}/deals`} colorScheme="brand">
            {t('detail.notFound.action')}
          </Button>
        }
      />
    );
  }

  const other = isBrand ? deal.creator : deal.brand;
  const name = firstName(other.name);
  const step = dealStepIndex(deal.status);

  const caption = (i: number, d: DealModel): string | undefined => {
    if (i === 0) return formatDate(d.createdAt);
    if (i === 1 && d.postBy) return t('detail.by', { date: formatDate(d.postBy, { day: 'numeric', month: 'short' }) });
    if (i > 1 && i <= step) return formatDate(d.updatedAt);
    return undefined;
  };

  const state = (() => {
    const key = deal.status;
    if (key === 'active' || key === 'proof_submitted') {
      const who = isBrand ? 'brand' : 'influencer';
      return {
        title: t(`detail.state.${key}.${who}.title`, { name }),
        body: t(`detail.state.${key}.${who}.body`, { name: other.name }),
      };
    }
    return { title: t(`detail.state.${key}.title`), body: t(`detail.state.${key}.body`) };
  })();

  const openChat = async () => {
    if (!other.userId) return;
    setOpening(true);
    try {
      const chat = await chatsService.createChat(other.userId);
      navigate(`${base}/messages`, { state: { activeChatId: chat.id } });
    } catch (err) {
      toast({ title: getErrorMessage(err, t('detail.messageError')), status: 'error' });
      setOpening(false);
    }
  };

  return (
    <PageContainer>
      <Box>
        <HStack spacing={2} fontSize="sm" color="fg.muted" wrap="wrap">
          <Link as={RouterLink} to={`${base}/deals`} color="primary.ink">
            {t('detail.crumb')}
          </Link>
          <Text as="span" aria-hidden="true">
            /
          </Text>
          <Text as="span" noOfLines={1}>
            {deal.order.title}
          </Text>
        </HStack>
        <Flex align="center" gap={3} wrap="wrap" mt={1.5}>
          <Heading as="h1" textStyle="h1">
            {t('detail.heading', { name: other.name })}
          </Heading>
          <StatusPill tone={DEAL_TONE[deal.status]}>{t(`status.${deal.status}`)}</StatusPill>
        </Flex>
      </Box>

      <Stepper
        label={t('detail.stepsLabel')}
        current={step}
        steps={DEAL_STEPS.map((s, i) => ({ label: t(`detail.steps.${s}`), caption: caption(i, deal) }))}
      />

      <Grid
        templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' }}
        gap={layout.grid}
        alignItems="start"
      >
        <Stack minW={0} spacing={4}>
          <Stack layerStyle="card" p={layout.card} spacing={3} as="section" aria-labelledby="deal-state">
            <Text id="deal-state" textStyle="h3">
              {state.title}
            </Text>
            <Text color="fg.muted">{state.body}</Text>
          </Stack>
        </Stack>

        <Box minW={0} layerStyle="card" as="section" aria-label={t('detail.facts.label')}>
          <Box as="ul" listStyleType="none">
            <Fact label={t('detail.facts.price')}>{formatMoney(deal.agreedPrice)}</Fact>
            <Fact label={t('detail.facts.payment')}>{t('detail.facts.paymentValue')}</Fact>
            <Fact label={t('detail.facts.deliverables')}>{deal.deliverables || t('detail.facts.none')}</Fact>
            <Fact label={t('detail.facts.postBy')}>
              {deal.postBy ? formatDate(deal.postBy) : t('detail.facts.none')}
            </Fact>
          </Box>
          {other.userId && (
            <Button
              variant="ghost"
              w="full"
              justifyContent="space-between"
              borderTopRadius={0}
              size="lg"
              px={4}
              rightIcon={<FiArrowRight aria-hidden="true" />}
              onClick={openChat}
              isLoading={opening}
            >
              {t('detail.message', { name })}
            </Button>
          )}
        </Box>
      </Grid>
    </PageContainer>
  );
};
