import React from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Card,
  CardHeader,
  CardBody,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '../../components/statistics/StatCard';
import { api } from '../../services/api';
import { BrandDashboardStats } from '../../types/statistics';

function Overview() {
  const toast = useToast();

  const { data: stats, error: statsError } = useQuery<BrandDashboardStats>({
    queryKey: ['brandStats'] as const,
    queryFn: async () => {
      const response = await api.get('/stats/brand');
      return response.data;
    },
  });

  const { data: recentCampaigns } = useQuery({
    queryKey: ['recentCampaigns'] as const,
    queryFn: async () => {
      const response = await api.get('/campaigns/recent');
      return response.data;
    },
  });

  React.useEffect(() => {
    if (statsError) {
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [statsError, toast]);

  return (
    <Box p={4}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={8}>
        <StatCard
          title="Active Campaigns"
          stat={stats?.activeCampaigns || 0}
          helpText="Current active campaigns"
        />
        <StatCard
          title="Total Reach"
          stat={stats?.totalReach?.toLocaleString() || 0}
          change={stats?.reachChange || 0}
        />
        <StatCard
          title="Engagement Rate"
          stat={`${stats?.engagementRate || 0}%`}
          change={stats?.engagementChange || 0}
        />
        <StatCard
          title="Connected Influencers"
          stat={stats?.connectedInfluencers || 0}
          helpText="Total partnerships"
        />
      </SimpleGrid>

      <Heading size="md" mb={4}>Recent Campaigns</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {recentCampaigns?.map((campaign: any) => (
          <Card key={campaign.id}>
            <CardHeader>
              <Heading size="sm">{campaign.name}</Heading>
            </CardHeader>
            <CardBody>
              <StatCard
                title="Status"
                stat={campaign.status}
              />
              <StatCard
                title="Budget"
                stat={`$${campaign.budget.toLocaleString()}`}
              />
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default Overview; 