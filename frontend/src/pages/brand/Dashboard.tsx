import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  useToast,
  Heading,
  Flex,
  Select,
  FormControl,
  FormLabel,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Text,
  Td,
  Tr,
  Link,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiList, FiActivity, FiInbox, FiUsers, FiMousePointer, FiEye, FiTrendingUp } from 'react-icons/fi';
import { LineChart } from '../../components/statistics/LineChart';
import { PieChart } from '../../components/statistics/PieChart';
import { StatsTable } from '../../components/statistics/StatsTable';
import { statisticsService } from '../../services/statistics';
import { BrandDashboardStats, CampaignStat } from '../../types/statistics';
import { Link as RouterLink } from 'react-router-dom';
import { usersService } from '../../services/users';
import api from '../../services/api';
import { PageHeader, StatCard, StatusBadge, StatCardSkeleton, EmptyState } from '../../components/ui';

export const BrandDashboard: React.FC = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    influencerId: '',
    category: '',
  });
  const [influencers, setInfluencers] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const { data: stats, isLoading, error } = useQuery<BrandDashboardStats, Error>({
    queryKey: ['brandStats', filters] as const,
    queryFn: () => statisticsService.getBrandStats(filters),
  });

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const influencersData = await usersService.getAllInfluencers();
        setInfluencers(influencersData.map(inf => ({ id: inf.id, name: inf.name })));
      } catch {
        toast({ title: 'Error loading influencers', status: 'error' });
      }

      try {
        const categoriesResponse = await api.get<string[]>('/categories');
        setCategories(categoriesResponse.data);
      } catch {
        toast({ title: 'Error loading categories', status: 'error' });
      }
    };

    fetchFiltersData();
  }, [toast]);

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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      influencerId: '',
      category: '',
    });
  };

  const campaignTableHeaders = [
    'Campaign',
    'Category',
    'Influencer',
    'Clicks',
    'Impressions',
    'Engagement',
    'Status',
    'Start Date',
    'End Date'
  ];

  const renderCampaignRow = (item: CampaignStat) => (
    <Tr key={item.id}>
      <Td>{item.name || 'N/A'}</Td>
      <Td>{item.category || 'N/A'}</Td>
      <Td>
        {item.influencerId ? (
          <Link as={RouterLink} to={`/brand/profile/${item.influencerId}`} color="accent.solid">
            {item.influencerName || 'N/A'}
          </Link>
        ) : (
          item.influencerName || 'N/A'
        )}
      </Td>
      <Td isNumeric>{item.clicks?.toLocaleString() || '0'}</Td>
      <Td isNumeric>{item.impressions?.toLocaleString() || '0'}</Td>
      <Td isNumeric>{item.engagementRate?.toFixed(1) || '0.0'}%</Td>
      <Td>
        <StatusBadge status={item.status || 'pending'} />
      </Td>
      <Td>{item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</Td>
      <Td>{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</Td>
    </Tr>
  );

  return (
    <Box>
      <PageHeader title="Brand Dashboard" subtitle="Campaign performance at a glance" />

      {/* Filters */}
      <Card mb={8}>
        <CardHeader pb={0}>
          <Heading as="h2" size="md">Filter Data</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <FormControl>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Influencer</FormLabel>
              <Select
                name="influencerId"
                value={filters.influencerId}
                onChange={handleFilterChange}
                placeholder="All Influencers"
              >
                {influencers.map(influencer => (
                  <option key={influencer.id} value={influencer.id}>
                    {influencer.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder="All Categories"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>
          <Flex justify="flex-end" mt={4}>
            <Button variant="outline" colorScheme="gray" onClick={handleResetFilters}>
              Reset
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* KPI cards */}
      <Heading as="h2" size="md" mb={4}>Overview</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={6} mb={8}>
        {isLoading || !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={FiList}
              label="Orders Created"
              value={stats.totalOrdersCreated}
            />
            <StatCard
              icon={FiActivity}
              label="Active Orders"
              value={stats.openOrders + stats.inProgressOrders}
              helpText={`Open: ${stats.openOrders} · In Progress: ${stats.inProgressOrders}`}
            />
            <StatCard
              icon={FiInbox}
              label="Applications Received"
              value={stats.totalApplicationsReceived}
              helpText={`Pending: ${stats.pendingApplications} · Accepted: ${stats.acceptedApplications}`}
            />
            <StatCard
              icon={FiUsers}
              label="Active Collaborations"
              value={stats.totalMatches - stats.completedMatches}
              helpText={`Completed: ${stats.completedMatches}`}
            />
          </>
        )}
      </SimpleGrid>

      <Heading as="h2" size="md" mb={4}>Performance Metrics</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6} mb={8}>
        {isLoading || !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={FiMousePointer}
              label="Total Clicks"
              value={stats.totalClicks.toLocaleString()}
            />
            <StatCard
              icon={FiEye}
              label="Total Impressions"
              value={stats.totalImpressions.toLocaleString()}
            />
            <StatCard
              icon={FiTrendingUp}
              label="Avg. Engagement Rate"
              value={`${stats.averageEngagementRate.toFixed(2)}%`}
            />
          </>
        )}
      </SimpleGrid>

      {/* Charts and table */}
      {!isLoading && stats && (
        <>
          <Heading as="h2" size="md" mb={4}>Details</Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
            <Card>
              <CardHeader pb={0}><Heading as="h3" size="sm">Performance Over Time</Heading></CardHeader>
              <CardBody>
                {stats.dailyStats && stats.dailyStats.length > 0 ? (
                  <LineChart data={stats.dailyStats} dataKey="clicks" />
                ) : (
                  <Text color="fg.muted">No daily data available to display chart.</Text>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader pb={0}><Heading as="h3" size="sm">Engagement by Category</Heading></CardHeader>
              <CardBody>
                {stats.campaignStats && stats.campaignStats.length > 0 ? (
                  <PieChart data={stats.campaignStats} nameKey="category" dataKey="engagementRate" />
                ) : (
                  <Text color="fg.muted">No campaign data available.</Text>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card>
            <CardHeader pb={0}><Heading as="h3" size="sm">Campaign Performance</Heading></CardHeader>
            <CardBody overflowX="auto">
              {stats.campaignStats && stats.campaignStats.length > 0 ? (
                <StatsTable
                  headers={campaignTableHeaders}
                  data={stats.campaignStats}
                  renderRow={renderCampaignRow}
                />
              ) : (
                <EmptyState
                  icon={FiActivity}
                  title="No campaign data yet"
                  description="Performance will appear here once your collaborations report stats."
                />
              )}
            </CardBody>
          </Card>
        </>
      )}
    </Box>
  );
};

export default BrandDashboard;
