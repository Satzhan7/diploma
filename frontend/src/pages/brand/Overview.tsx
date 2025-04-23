import React from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
// import { StatCard } from '../../components/statistics/StatCard';
import api from '../../services/api';
import { BrandDashboardStats } from '../../types/statistics';

// Локальная версия компонента StatCard
const StatCard: React.FC<{
  title: string;
  value: string | number;
  helpText?: string;
  change?: number;
  isIncrease?: boolean;
  icon?: React.ReactNode;
}> = ({ title, value, helpText, change, isIncrease, icon }) => {
  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      _hover={{ shadow: 'lg' }}
      transition="all 0.3s"
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel fontWeight="medium" isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold">
            {value}
          </StatNumber>
          {(helpText || change !== undefined) && (
            <StatHelpText mb={0}>
              {change !== undefined && (
                <>
                  <StatArrow type={isIncrease ? 'increase' : 'decrease'} />
                  {change}%
                </>
              )}
              {helpText && (change !== undefined ? ' ' : '') + helpText}
            </StatHelpText>
          )}
        </Stat>
        {icon && <Box ml={2}>{icon}</Box>}
      </Flex>
    </Box>
  );
};

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
          value={stats?.activeCampaigns || 0}
          helpText="Current active campaigns"
        />
        <StatCard
          title="Total Reach"
          value={stats?.totalReach?.toLocaleString() || 0}
          change={stats?.reachChange || 0}
          isIncrease={stats?.reachChange ? stats.reachChange > 0 : true}
        />
        <StatCard
          title="Engagement Rate"
          value={`${stats?.engagementRate || 0}%`}
          change={stats?.engagementChange || 0}
          isIncrease={stats?.engagementChange ? stats.engagementChange > 0 : true}
        />
        <StatCard
          title="Connected Influencers"
          value={stats?.connectedInfluencers || 0}
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
                value={campaign.status}
              />
              <StatCard
                title="Budget"
                value={`$${campaign.budget.toLocaleString()}`}
              />
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default Overview; 