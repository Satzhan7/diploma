import React from 'react';
import { Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiClock, FiSend, FiThumbsUp } from 'react-icons/fi';
import { applicationsService } from '../../services/applications';
import { dealsService } from '../../services/deals';
import { PageHeader, StatCard, StatCardSkeleton, EmptyState } from '../../components/ui';
import { RecentDeals } from '../../components/RecentDeals';

// Interim overview until R6: real counts from the creator's applications and
// deals (the old collaboration statistics are gone).
export const InfluencerDashboard: React.FC = () => {
  const { t } = useTranslation('influencer');

  const applications = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: applicationsService.getMyApplications,
  });
  const activeDeals = useQuery({
    queryKey: ['deals', 'active-count'],
    queryFn: () => dealsService.list({ status: 'active', take: 1 }),
  });

  const list = applications.data ?? [];
  const count = (status: string) => list.filter((a) => a.status === status).length;

  return (
    <Stack spacing={8}>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <Stack as="section" spacing={4} aria-labelledby="overview">
        <Heading as="h2" id="overview" size="md">
          {t('dashboard.overview.title')}
        </Heading>
        {applications.isError ? (
          <EmptyState title={t('dashboard.loadError')} />
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
            {applications.isPending || activeDeals.isPending ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard icon={FiSend} label={t('dashboard.overview.applicationsSent')} value={list.length} />
                <StatCard icon={FiClock} label={t('dashboard.overview.pending')} value={count('pending')} />
                <StatCard icon={FiThumbsUp} label={t('dashboard.overview.accepted')} value={count('accepted')} />
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

      <RecentDeals viewer="influencer" />
    </Stack>
  );
};

export default InfluencerDashboard;
