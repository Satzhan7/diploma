import React from 'react';
import { Button, Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { FiActivity, FiCheckCircle, FiInbox, FiList, FiPlus } from 'react-icons/fi';
import { briefsService } from '../../services/briefs';
import { dealsService } from '../../services/deals';
import { PageHeader, StatCard, StatCardSkeleton, EmptyState } from '../../components/ui';
import { RecentDeals } from '../../components/RecentDeals';

// Interim home until R6 rebuilds it from the mockup: real counts from the
// brand's briefs and deals (the old campaign statistics are gone).
export const BrandDashboard: React.FC = () => {
  const { t } = useTranslation('brand');

  // Counts over the newest 100 briefs until R6 adds a summary endpoint.
  const orders = useQuery({
    queryKey: ['briefs', 'summary'],
    queryFn: () => briefsService.listMine({ take: 100 }),
  });
  const activeDeals = useQuery({
    queryKey: ['deals', 'active-count'],
    queryFn: () => dealsService.list({ status: 'active', take: 1 }),
  });

  const list = orders.data?.items ?? [];
  const sum = (key: 'applicationsCount' | 'pendingCount') => list.reduce((n, o) => n + (o[key] ?? 0), 0);
  const pending = sum('pendingCount');

  return (
    <Stack spacing={8}>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <Button as={RouterLink} to="/brand/briefs/new" colorScheme="brand" leftIcon={<FiPlus />}>
            {t('dashboard.newBrief')}
          </Button>
        }
      />

      <Stack as="section" spacing={4} aria-labelledby="overview">
        <Heading as="h2" id="overview" size="md">
          {t('dashboard.overview.title')}
        </Heading>
        {orders.isError ? (
          <EmptyState title={t('dashboard.loadError')} />
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
            {orders.isPending || activeDeals.isPending ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard icon={FiList} label={t('dashboard.overview.briefs')} value={orders.data?.total ?? 0} />
                <StatCard
                  icon={FiActivity}
                  label={t('dashboard.overview.openBriefs')}
                  value={list.filter((o) => o.status === 'open').length}
                />
                <StatCard
                  icon={FiInbox}
                  label={t('dashboard.overview.applications')}
                  value={sum('applicationsCount')}
                  helpText={t('dashboard.overview.pending', { count: pending })}
                />
                <StatCard
                  icon={FiCheckCircle}
                  label={t('dashboard.overview.activeDeals')}
                  value={activeDeals.data?.total ?? 0}
                />
              </>
            )}
          </SimpleGrid>
        )}
      </Stack>

      <RecentDeals viewer="brand" />
    </Stack>
  );
};

export default BrandDashboard;
