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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  Td,
  Tr,
  Badge,
  Link,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from '../../components/statistics/LineChart';
import { PieChart } from '../../components/statistics/PieChart';
import { StatsTable } from '../../components/statistics/StatsTable';
import { statisticsService } from '../../services/statistics';
import { InfluencerDashboardStats, CampaignStat } from '../../types/statistics';
import { Link as RouterLink } from 'react-router-dom';
import { usersService } from '../../services/users';
import api from '../../services/api';

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

  // Загрузка списка брендов и категорий
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Use usersService to get brands
        const brandsData = await usersService.getAllBrands(); 
        setBrands(brandsData.map(b => ({ id: b.id, name: b.name })));
      } catch (err) {
        console.error('Failed to load brands', err);
        toast({ title: 'Error loading brands', status: 'error' });
      }
      
      try {
        // Use new /categories endpoint
        const categoriesResponse = await api.get<string[]>('/categories'); 
        setCategories(categoriesResponse.data);
      } catch (err) {
        console.error('Failed to load categories', err);
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

  // Define headers for the StatsTable
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

  // Define how to render each row for the campaign stats
  const renderCampaignRow = (item: CampaignStat) => (
    <Tr key={item.id}>
      <Td>{item.name || 'N/A'}</Td>
      <Td>{item.category || 'N/A'}</Td>
      <Td>
        {item.brandId ? (
          <Link as={RouterLink} to={`/profile/${item.brandId}`} color="blue.500">
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
        <Badge colorScheme={item.status === 'completed' ? 'green' : item.status === 'accepted' ? 'blue' : 'gray'}>
          {item.status || 'pending'}
        </Badge>
      </Td>
      <Td>{item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</Td>
      <Td>{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</Td>
    </Tr>
  );

  if (isLoading) {
    return <Box p={8}>Loading dashboard data...</Box>;
  }

  if (!stats) {
    return <Box p={8}>No data available</Box>;
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>My Statistics</Heading>
      
      {/* Фильтры */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Filter Data</Heading>
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
            <Button variant="outline" mr={3} onClick={handleResetFilters}>
              Reset
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Ключевые метрики */}
      <Heading size="md" mb={4}>Overview</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6} mb={8}>
        <Card variant="outline">
          <CardBody>
            <Stat>
              <StatLabel>Applications Sent</StatLabel>
              <StatNumber>{stats.totalApplicationsSent}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card variant="outline">
          <CardBody>
            <Stat>
              <StatLabel>Active Applications</StatLabel>
              <StatNumber>{stats.pendingApplications}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card variant="outline">
          <CardBody>
            <Stat>
              <StatLabel>Accepted / Rejected</StatLabel>
              <StatNumber>{stats.acceptedApplications} / {stats.rejectedApplications}</StatNumber>
              <StatHelpText>Withdrawn: {stats.withdrawnApplications}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card variant="outline">
          <CardBody>
            <Stat>
              <StatLabel>Collaborations</StatLabel>
              <StatNumber>{stats.totalMatches}</StatNumber>
               <StatHelpText>Completed: {stats.completedMatches}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Heading size="md" mb={4}>Performance Metrics</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card variant="outline">
          <CardBody>
            <Stat>
              <StatLabel>Total Clicks</StatLabel>
              <StatNumber>{stats.totalClicks.toLocaleString()}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card variant="outline">
          <CardBody>
            <Stat>
              <StatLabel>Total Impressions</StatLabel>
              <StatNumber>{stats.totalImpressions.toLocaleString()}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card variant="outline">
          <CardBody>
            <Stat>
              <StatLabel>Avg. Engagement Rate</StatLabel>
              <StatNumber>{stats.averageEngagementRate.toFixed(2)}%</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card variant="outline">
          <CardBody>
            <Stat>
              <StatLabel>Follower Growth</StatLabel>
              <StatNumber>+{stats.followerGrowth.toLocaleString()}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Графики и Таблицы */}
      <Heading size="md" mb={4}>Details</Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card variant="outline">
          <CardHeader><Heading size="sm">Performance Over Time</Heading></CardHeader>
          <CardBody>
             {stats.dailyStats && stats.dailyStats.length > 0 ? (
              <LineChart data={stats.dailyStats} dataKey="engagementRate" />
            ) : (
              <Text>No daily data available to display chart.</Text>
            )}
          </CardBody>
        </Card>
        <Card variant="outline">
          <CardHeader><Heading size="sm">Impressions by Category</Heading></CardHeader>
           <CardBody>
             {stats.campaignStats && stats.campaignStats.length > 0 ? (
                <PieChart data={stats.campaignStats} nameKey="category" dataKey="impressions" />
             ) : (
               <Text>No campaign data available.</Text>
             )}
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card variant="outline">
        <CardHeader><Heading size="sm">Collaboration Performance</Heading></CardHeader>
        <CardBody overflowX="auto">
          {stats.campaignStats && stats.campaignStats.length > 0 ? (
            <StatsTable 
                headers={campaignTableHeaders}
                data={stats.campaignStats}
                renderRow={renderCampaignRow}
            />
           ) : (
             <Text>No collaboration data available.</Text>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default InfluencerDashboard; 