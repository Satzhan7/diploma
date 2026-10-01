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
import { FiSend, FiClock, FiCheckCircle, FiUsers, FiMousePointer, FiEye, FiTrendingUp, FiUserPlus, FiActivity } from 'react-icons/fi';
import { LineChart } from '../../components/statistics/LineChart';
import { PieChart } from '../../components/statistics/PieChart';
import { StatsTable } from '../../components/statistics/StatsTable';
import { statisticsService } from '../../services/statistics';
import { InfluencerDashboardStats, CampaignStat } from '../../types/statistics';
import { Link as RouterLink } from 'react-router-dom';
import { usersService } from '../../services/users';
import api from '../../services/api';
import { PageHeader, StatCard, StatusBadge, StatCardSkeleton, EmptyState } from '../../components/ui';

export const InfluencerDashboard: React.FC = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    brandId: '',
    category: '',
  });
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const { data: stats, isLoading, error } = useQuery<InfluencerDashboardStats, Error>({
    queryKey: ['influencerStats', filters] as const,
    queryFn: () => statisticsService.getInfluencerStats(filters),
  });

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const brandsData = await usersService.getAllBrands();
        setBrands(brandsData.map(b => ({ id: b.id, name: b.name })));
      } catch (err) {
        toast({ title: 'Error loading brands', status: 'error' });
      }

      try {
        const categoriesResponse = await api.get<string[]>('/categories');
        setCategories(categoriesResponse.data);
      } catch (err) {
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
      brandId: '',
      category: '',
    });
  };

  const campaignTableHeaders = [
    'Campaign',
    'Category',
    'Brand',
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
        {item.brandId ? (
          <Link as={RouterLink} to={`/influencer/profile/${item.brandId}`} color="accent.solid">
            {item.brandName || 'N/A'}
          </Link>
        ) : (
          item.brandName || 'N/A'
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
      <PageHeader title="My Statistics" subtitle="Your applications and collaboration performance" />

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
              <FormLabel>Brand</FormLabel>
              <Select
                name="brandId"
                value={filters.brandId}
                onChange={handleFilterChange}
                placeholder="All Brands"
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
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
              icon={FiSend}
              label="Applications Sent"
              value={stats.totalApplicationsSent}
            />
            <StatCard
              icon={FiClock}
              label="Active Applications"
              value={stats.pendingApplications}
            />
            <StatCard
              icon={FiCheckCircle}
              label="Accepted / Rejected"
              value={`${stats.acceptedApplications} / ${stats.rejectedApplications}`}
              helpText={`Withdrawn: ${stats.withdrawnApplications}`}
            />
            <StatCard
              icon={FiUsers}
              label="Collaborations"
              value={stats.totalMatches}
              helpText={`Completed: ${stats.completedMatches}`}
            />
          </>
        )}
      </SimpleGrid>

      <Heading as="h2" size="md" mb={4}>Performance Metrics</Heading>
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
            <StatCard
              icon={FiUserPlus}
              label="Follower Growth"
              value={`+${stats.followerGrowth.toLocaleString()}`}
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
                  <LineChart data={stats.dailyStats} dataKey="engagementRate" />
                ) : (
                  <Text color="fg.muted">No daily data available to display chart.</Text>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader pb={0}><Heading as="h3" size="sm">Impressions by Category</Heading></CardHeader>
              <CardBody>
                {stats.campaignStats && stats.campaignStats.length > 0 ? (
                  <PieChart data={stats.campaignStats} nameKey="category" dataKey="impressions" />
                ) : (
                  <Text color="fg.muted">No campaign data available.</Text>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card>
            <CardHeader pb={0}><Heading as="h3" size="sm">Collaboration Performance</Heading></CardHeader>
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
                  title="No collaboration data yet"
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

export default InfluencerDashboard;
