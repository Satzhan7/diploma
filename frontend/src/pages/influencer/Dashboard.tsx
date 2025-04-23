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
  StatArrow,
  Text,
  Td,
  Tr,
  Badge,
  Link,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from '../../components/statistics/LineChart';
import { PieChart } from '../../components/statistics/PieChart';
import { StatsTable, StatItem } from '../../components/statistics/StatsTable';
import { statisticsService } from '../../services/statistics';
import { InfluencerDashboardStats } from '../../types/statistics';
import { Link as RouterLink } from 'react-router-dom';

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
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        setBrands(data);
      } catch (error) {
        console.error('Failed to load brands', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };

    fetchBrands();
    fetchCategories();
  }, []);

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

  const handleApplyFilters = () => {
    // Фильтры автоматически применяются через useQuery
    toast({
      title: 'Filters applied',
      description: 'Dashboard data updated',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
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
  const renderCampaignRow = (item: StatItem) => (
    <Tr key={item.id}>
      <Td>{item.name || 'N/A'}</Td>
      <Td>{item.category || 'N/A'}</Td>
      <Td>
        {item.brandId ? (
          <Link as={RouterLink} to={`/profile/user/${item.brandId}`} color="blue.500">
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
        <Badge colorScheme={item.status === 'completed' ? 'green' : item.status === 'active' ? 'blue' : 'gray'}>
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
            <Button colorScheme="blue" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Ключевые метрики */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" fontWeight="medium" color="gray.500">Post Clicks</StatLabel>
              <StatNumber fontSize="2xl">{stats.totalClicks.toLocaleString()}</StatNumber>
              {stats.clicksChange && (
                <StatHelpText>
                  <StatArrow type={stats.clicksChange > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats.clicksChange).toFixed(1)}%
                </StatHelpText>
              )}
              <Text fontSize="xs" color="gray.500">Total clicks across all posts</Text>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" fontWeight="medium" color="gray.500">Impressions</StatLabel>
              <StatNumber fontSize="2xl">{stats.totalImpressions.toLocaleString()}</StatNumber>
              {stats.impressionsChange && (
                <StatHelpText>
                  <StatArrow type={stats.impressionsChange > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats.impressionsChange).toFixed(1)}%
                </StatHelpText>
              )}
              <Text fontSize="xs" color="gray.500">Total content impressions</Text>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" fontWeight="medium" color="gray.500">Engagement Rate</StatLabel>
              <StatNumber fontSize="2xl">{stats.averageEngagementRate.toFixed(1)}%</StatNumber>
              {stats.engagementChange && (
                <StatHelpText>
                  <StatArrow type={stats.engagementChange > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats.engagementChange).toFixed(1)}%
                </StatHelpText>
              )}
              <Text fontSize="xs" color="gray.500">Likes, comments, shares / impressions</Text>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" fontWeight="medium" color="gray.500">Follower Growth</StatLabel>
              <StatNumber fontSize="2xl">+{stats.followerGrowth.toLocaleString()}</StatNumber>
              {stats.followerGrowthChange && (
                <StatHelpText>
                  <StatArrow type={stats.followerGrowthChange > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats.followerGrowthChange).toFixed(1)}%
                </StatHelpText>
              )}
              <Text fontSize="xs" color="gray.500">New followers during campaign periods</Text>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Графики изменения во времени */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card>
          <CardHeader>
            <Heading size="md">Follower Growth Over Time</Heading>
          </CardHeader>
          <CardBody>
            {stats.dailyStats?.length > 0 ? (
              <LineChart
                data={stats.dailyStats}
                dataKey="followerGrowth"
                color="#3182CE"
                xAxisDataKey="date"
                prefix="+"
              />
            ) : (
              <Text>No daily follower data available.</Text>
            )}
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Engagement Rate Over Time</Heading>
          </CardHeader>
          <CardBody>
            <Box h="300px">
              <LineChart
                data={stats.dailyStats}
                dataKey="engagementRate"
                color="#38A169"
                xAxisDataKey="date"
                suffix="%"
              />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Круговые диаграммы */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card>
          <CardHeader>
            <Heading size="md">Campaign Performance (Clicks)</Heading>
          </CardHeader>
          <CardBody>
            <Box h="300px">
              <PieChart
                data={stats.campaignStats}
                dataKey="clicks"
                nameKey="name"
              />
            </Box>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Engagement by Campaign</Heading>
          </CardHeader>
          <CardBody>
            <Box h="300px">
              <PieChart
                data={stats.campaignStats}
                dataKey="engagementRate"
                nameKey="name"
                suffix="%"
              />
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Таблица кампаний */}
      <Card>
        <CardHeader>
          <Heading size="md">Campaign Statistics</Heading>
        </CardHeader>
        <CardBody>
          {stats.campaignStats?.length > 0 ? (
            <StatsTable 
              title="Campaign Details" 
              data={stats.campaignStats}
              headers={campaignTableHeaders}
              renderRow={renderCampaignRow} 
            />
          ) : (
            <Text>No campaign data available for the selected period.</Text>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}; 