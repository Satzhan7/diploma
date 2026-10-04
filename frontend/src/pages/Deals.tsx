import React, { useState } from 'react';
import { Button, Center, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import { dealsService } from '../services/deals';
import { DealCard } from '../components/DealCard';
import { CardGridSkeleton, EmptyState, PageHeader, SegmentedControl } from '../components/ui';

const PAGE_SIZE = 20;

type Filter = 'all' | 'active' | 'completed';

export const Deals: React.FC = () => {
  const { t } = useTranslation('deals');
  const { user } = useAuth();
  const isBrand = user?.role === UserRole.BRAND;
  const base = isBrand ? '/brand' : '/influencer';
  const [filter, setFilter] = useState<Filter>('all');

  const query = useInfiniteQuery({
    queryKey: ['deals', filter],
    queryFn: ({ pageParam }) =>
      dealsService.list({
        take: PAGE_SIZE,
        skip: pageParam,
        status: filter === 'all' ? undefined : filter,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.skip + last.items.length < last.total ? last.skip + last.items.length : undefined,
  });

  const deals = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <Stack spacing={6}>
      <PageHeader title={t('title')} subtitle={t(isBrand ? 'subtitle.brand' : 'subtitle.influencer')} />

      <SegmentedControl<Filter>
        label={t('filter.label')}
        value={filter}
        onChange={setFilter}
        segments={[
          { value: 'all', label: t('filter.all') },
          { value: 'active', label: t('filter.active') },
          { value: 'completed', label: t('filter.completed') },
        ]}
      />

      {query.isPending ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <EmptyState title={t('loadError')} action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>} />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={FiCheckCircle}
          title={t('empty.title')}
          description={t(isBrand ? 'empty.brand' : 'empty.influencer')}
          action={
            <Button as={RouterLink} to={`${base}/orders`} colorScheme="brand">
              {t(isBrand ? 'empty.brandAction' : 'empty.influencerAction')}
            </Button>
          }
        />
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} viewer={isBrand ? 'brand' : 'influencer'} />
            ))}
          </SimpleGrid>
          <Center flexDirection="column" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {t('count', { shown: deals.length, total })}
            </Text>
            {query.hasNextPage && (
              <Button variant="outline" onClick={() => query.fetchNextPage()} isLoading={query.isFetchingNextPage}>
                {t('more')}
              </Button>
            )}
          </Center>
        </>
      )}
    </Stack>
  );
};
