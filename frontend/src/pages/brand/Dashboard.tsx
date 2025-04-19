import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { StatsCard } from '../../components/statistics/StatsCard';
import { LineChart } from '../../components/statistics/LineChart';
import { PieChart } from '../../components/statistics/PieChart';
import { StatsTable } from '../../components/statistics/StatsTable';
import { statisticsService } from '../../services/statistics';
import { BrandDashboardStats } from '../../types/statistics';

export const BrandDashboard: React.FC = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    influencerId: '',
    category: '',
  });

  const { data: stats, isLoading, error } = useQuery<BrandDashboardStats, Error>({
    queryKey: ['brandStats', filters] as const,
    queryFn: () => statisticsService.getBrandStats(filters),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  if (!stats) {
    return <Box>No data available</Box>;
  }

  return (
    <Box p={4}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={8}>
        <StatsCard
          label="Campaign Clicks"
          value={stats.totalClicks}
          prefix=""
        />
        <StatsCard
          label="Impressions"
          value={stats.totalImpressions}
          prefix=""
        />
        <StatsCard
          label="Engagement Rate"
          value={stats.averageEngagementRate}
          suffix="%"
        />
        <StatsCard
          label="Partner Follower Growth"
          value={stats.totalFollowerGrowth}
          prefix="+"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
        <LineChart
          title="Clicks Over Time"
          data={stats.dailyStats}
          dataKey="clicks"
          color="#3182CE"
        />
        <LineChart
          title="Engagement Rate Over Time"
          data={stats.dailyStats}
          dataKey="engagementRate"
          color="#38A169"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
        <PieChart
          title="Campaign Performance"
          data={stats.campaignStats}
          dataKey="clicks"
          nameKey="name"
        />
        <PieChart
          title="Engagement by Campaign"
          data={stats.campaignStats}
          dataKey="engagementRate"
          nameKey="name"
        />
      </SimpleGrid>

      <StatsTable
        title="Campaign Statistics"
        data={stats.campaignStats}
        onFilterChange={(newFilters) => {
          setFilters((prev) => ({ ...prev, ...newFilters }));
        }}
      />
    </Box>
  );
}; 