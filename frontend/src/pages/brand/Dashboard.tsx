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
import { BrandDashboardStats } from '../../types/statistics';
import { Link as RouterLink } from 'react-router-dom';

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

  // Загрузка списка инфлюенсеров и категорий
  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const response = await fetch('/api/influencers');
        const data = await response.json();
        setInfluencers(data);
      } catch (error) {
        console.error('Failed to load influencers', error);
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

    fetchInfluencers();
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
      influencerId: '',
      category: '',
    });
  };

  if (isLoading) {
    return <Box p={8}>Loading dashboard data...</Box>;
  }

  if (!stats) {
    return <Box p={8}>No data available</Box>;
  }

  // Define headers for the StatsTable
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

  // Update renderCampaignRow to accept StatItem
  const renderCampaignRow = (item: StatItem) => (
    <Tr key={item.id}>
      <Td>{item.name || 'N/A'}</Td>
      <Td>{item.category || 'N/A'}</Td>
      <Td>
        {item.influencerId ? (
          <Link as={RouterLink} to={`/profile/user/${item.influencerId}`} color="blue.500">
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
        <Badge colorScheme={item.status === 'completed' ? 'green' : item.status === 'active' ? 'blue' : 'gray'}>
          {item.status || 'pending'}
        </Badge>
      </Td>
      <Td>{item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</Td>
      <Td>{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</Td>
    </Tr>
  );

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Brand Dashboard</Heading>
      
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
              <StatLabel fontSize="sm" fontWeight="medium" color="gray.500">Campaign Clicks</StatLabel>
              <StatNumber fontSize="2xl">{stats.totalClicks.toLocaleString()}</StatNumber>
              {stats.clicksChange && (
                <StatHelpText>
                  <StatArrow type={stats.clicksChange > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats.clicksChange).toFixed(1)}%
                </StatHelpText>
              )}
              <Text fontSize="xs" color="gray.500">Total clicks across all campaigns</Text>
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
              <Text fontSize="xs" color="gray.500">Total ad impressions</Text>
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
              <StatLabel fontSize="sm" fontWeight="medium" color="gray.500">Partner Follower Growth</StatLabel>
              <StatNumber fontSize="2xl">+{stats.totalFollowerGrowth.toLocaleString()}</StatNumber>
              <Text fontSize="xs" color="gray.500">Followers gained across all partners</Text>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Графики изменения во времени */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card>
          <CardHeader>
            <Heading size="md">Clicks Over Time</Heading>
          </CardHeader>
          <CardBody>
            {stats.dailyStats?.length > 0 ? (
                <LineChart data={stats.dailyStats} dataKey="clicks" />
             ) : (
                <Text>No daily click data available.</Text>
             )}
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Impressions by Category</Heading>
          </CardHeader>
          <CardBody>
             {/* TODO: Need data formatted for PieChart (e.g., [{ name: category, value: impressions }]) */}
             <Text>Category impression chart placeholder.</Text>
             {/* <PieChart data={formattedCategoryData} /> */}
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
          <Heading size="md">Campaign Performance</Heading>
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