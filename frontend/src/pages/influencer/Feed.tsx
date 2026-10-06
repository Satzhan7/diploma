import React, { useState } from 'react';
import { Box, Button, Center, Flex, HStack, Select, Text } from '@chakra-ui/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { Brief, BriefCity, briefsService, CATEGORIES, CITIES } from '../../services/briefs';
import { nextSkip } from '../../services/page';
import { getErrorMessage } from '../../i18n/errors';
import { useBriefText } from '../../components/useBriefText';
import {
  BriefCard,
  CardGridSkeleton,
  EmptyState,
  PageHeader,
  StatusBadge,
  StatusPill,
  PageContainer,
  ResponsiveGrid,
} from '../../components/ui';

const PAGE_SIZE = 20;

export const Feed: React.FC = () => {
  const text = useBriefText();
  const { t } = text;
  const [category, setCategory] = useState<string | undefined>();
  const [city, setCity] = useState<BriefCity | undefined>();

  const query = useInfiniteQuery({
    queryKey: ['briefs', 'feed', category ?? 'all', city ?? 'all'],
    queryFn: ({ pageParam }) => briefsService.feed({ take: PAGE_SIZE, skip: pageParam, category, city }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
  });
  const briefs = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  const chip = (value: string | undefined, label: string) => {
    const on = category === value;
    return (
      <Button
        key={value ?? 'all'}
        size="sm"
        flex="none"
        borderRadius="full"
        variant="outline"
        aria-pressed={on}
        borderColor={on ? 'primary' : 'border.default'}
        bg={on ? 'primary.soft' : 'transparent'}
        color={on ? 'primary.ink' : 'fg.default'}
        fontWeight="500"
        onClick={() => setCategory(value)}
      >
        {label}
      </Button>
    );
  };

  const leftBadge = (brief: Brief) => {
    if (brief.myApplication) return <StatusBadge status={brief.myApplication.status} />;
    if (!brief.postBy) return null;
    const left = text.timeLeft(brief.postBy);
    return <StatusPill tone={left.hot ? 'warn' : 'neutral'}>{left.label}</StatusPill>;
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('feed.title')}
        subtitle={query.isSuccess ? t('feed.subtitle', { count: total }) : undefined}
      />

      <Flex gap={3} wrap="wrap" align="center">
        <Box flex="1 1 17.5rem" minW={0} overflowX="auto">
          <HStack spacing={2} role="group" aria-label={t('feed.nicheLabel')} pb={1}>
            {chip(undefined, t('feed.all'))}
            {CATEGORIES.map((value) => chip(value, text.category(value)))}
          </HStack>
        </Box>
        <Select
          aria-label={t('feed.cityLabel')}
          w={{ base: 'full', sm: 52 }}

          value={city ?? ''}
          onChange={(e) => setCity((e.target.value || undefined) as BriefCity | undefined)}
        >
          <option value="">{t('feed.anyCity')}</option>
          {CITIES.filter((c) => c !== 'any').map((c) => (
            <option key={c} value={c}>
              {t(`city.${c}`)}
            </option>
          ))}
        </Select>
      </Flex>

      {query.isPending ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={getErrorMessage(query.error)}
          action={<Button onClick={() => query.refetch()}>{t('common:actions.retry')}</Button>}
        />
      ) : briefs.length === 0 ? (
        <EmptyState icon={FiSearch} title={t('feed.empty.title')} description={t('feed.empty.description')} />
      ) : (
        <>
          <ResponsiveGrid>
            {briefs.map((brief) => (
              <BriefCard
                key={brief.id}
                partyName={brief.brand?.name ?? ''}
                partyAvatarUrl={brief.brand?.avatarUrl}
                partyCaption={text.city(brief.city)}
                badge={leftBadge(brief)}
                title={brief.title}
                chips={text.chips(brief)}
                amount={text.budget(brief) ?? '—'}
                amountCaption={t('feed.applied', { count: brief.applicationsCount ?? 0 })}
                action={
                  <Button
                    as={RouterLink}
                    to={`/influencer/briefs/${brief.id}`}
                    colorScheme={brief.myApplication ? undefined : 'brand'}
                    variant={brief.myApplication ? 'outline' : 'solid'}
                    aria-label={t(brief.myApplication ? 'feed.viewLabel' : 'feed.applyLabel', { title: brief.title })}
                  >
                    {t(brief.myApplication ? 'feed.view' : 'feed.apply')}
                  </Button>
                }
              />
            ))}
          </ResponsiveGrid>
          <Center flexDirection="column" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {t('list.count', { shown: briefs.length, total })}
            </Text>
            {query.hasNextPage && (
              <Button variant="outline" onClick={() => query.fetchNextPage()} isLoading={query.isFetchingNextPage}>
                {t('list.more')}
              </Button>
            )}
          </Center>
        </>
      )}
    </PageContainer>
  );
};
