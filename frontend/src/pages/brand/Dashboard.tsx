import React from 'react';
import { Button, Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { FiActivity, FiCheckCircle, FiInbox, FiList, FiPlus } from 'react-icons/fi';
import { ordersService } from '../../services/orders';
import { dealsService } from '../../services/deals';
import { PageHeader, StatCard, StatCardSkeleton, EmptyState } from '../../components/ui';
import { RecentDeals } from '../../components/RecentDeals';

// Interim home until R6 rebuilds it from the mockup: real counts from the
// brand's briefs and deals (the old campaign statistics are gone).
export const BrandDashboard: React.FC = () => {
  const { t } = useTranslation('brand');

  const orders = useQuery({ queryKey: ['orders', 'brand'], queryFn: ordersService.getByBrand });
  const activeDeals = useQuery({
    queryKey: ['deals', 'active-count'],
    queryFn: () => dealsService.list({ status: 'active', take: 1 }),
  });

  const list = orders.data ?? [];
  const applications = list.flatMap((o) => o.applications ?? []);
  const pending = applications.filter((a) => a.status === 'pending').length;

  return (
    <Stack spacing={8}>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <Button as={RouterLink} to="/brand/orders/create" colorScheme="brand" leftIcon={<FiPlus />}>
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
                <StatCard icon={FiList} label={t('dashboard.overview.briefs')} value={list.length} />
                <StatCard
                  icon={FiActivity}
                  label={t('dashboard.overview.openBriefs')}
                  value={list.filter((o) => o.status === 'open').length}
                />
                <StatCard
                  icon={FiInbox}
                  label={t('dashboard.overview.applications')}
                  value={applications.length}
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
