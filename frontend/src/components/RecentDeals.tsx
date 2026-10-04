import React from 'react';
import { Button, Flex, Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import { dealsService } from '../services/deals';
import { DealCard } from './DealCard';
import { CardGridSkeleton, EmptyState } from './ui';

interface RecentDealsProps {
  viewer: 'brand' | 'influencer';
}

/** The newest three deals with a link to the full list (dashboards). */
export const RecentDeals: React.FC<RecentDealsProps> = ({ viewer }) => {
  const { t } = useTranslation('deals');
  const { data, isPending, isError } = useQuery({
    queryKey: ['deals', 'recent'],
    queryFn: () => dealsService.list({ take: 3 }),
  });

  return (
    <Stack as="section" spacing={4} aria-labelledby="recent-deals">
      <Flex justify="space-between" align="center" gap={3}>
        <Heading as="h2" id="recent-deals" size="md">
          {t('recent')}
        </Heading>
        {!!data?.total && (
          <Button as={RouterLink} to={`/${viewer}/deals`} variant="ghost" size="sm">
            {t('allDeals')}
          </Button>
        )}
      </Flex>
      {isPending ? (
        <CardGridSkeleton count={3} />
      ) : isError ? (
        <EmptyState title={t('loadError')} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={FiCheckCircle}
          title={t('empty.title')}
          description={t(viewer === 'brand' ? 'empty.brand' : 'empty.influencer')}
        />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {data.items.map((deal) => (
            <DealCard key={deal.id} deal={deal} viewer={viewer} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};
