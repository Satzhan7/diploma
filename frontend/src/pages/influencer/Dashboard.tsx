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
import { useTranslation } from 'react-i18next';
import { formatDate, formatNumber } from '../../i18n';

export const InfluencerDashboard: React.FC = () => {
  const { t } = useTranslation('influencer');
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
      } catch {
        toast({ title: t('dashboard.errors.brands'), status: 'error' });
      }

      try {
        const categoriesResponse = await api.get<string[]>('/categories');
        setCategories(categoriesResponse.data);
      } catch {
        toast({ title: t('dashboard.errors.categories'), status: 'error' });
      }
    };

    fetchFiltersData();
  }, [toast, t]);

  useEffect(() => {
    if (error) {
      toast({
        title: t('common:state.error'),
        description: t('dashboard.errors.stats'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast, t]);

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
    t('dashboard.table.campaign'),
    t('dashboard.table.category'),
    t('dashboard.table.brand'),
    t('dashboard.table.clicks'),
    t('dashboard.table.impressions'),
    t('dashboard.table.engagement'),
    t('dashboard.table.status'),
    t('dashboard.table.startDate'),
    t('dashboard.table.endDate'),
  ];

  const renderCampaignRow = (item: CampaignStat) => (
    <Tr key={item.id}>
      <Td>{item.name || t('shared.notAvailable')}</Td>
      <Td>{item.category || t('shared.notAvailable')}</Td>
      <Td>
        {item.brandId ? (
          <Link as={RouterLink} to={`/influencer/profile/${item.brandId}`} color="accent.solid">
            {item.brandName || t('shared.notAvailable')}
          </Link>
        ) : (
          item.brandName || t('shared.notAvailable')
        )}
      </Td>
      <Td isNumeric>{formatNumber(item.clicks ?? 0)}</Td>
      <Td isNumeric>{formatNumber(item.impressions ?? 0)}</Td>
      <Td isNumeric>{item.engagementRate?.toFixed(1) || '0.0'}%</Td>
      <Td>
        <StatusBadge status={item.status || 'pending'} />
      </Td>
      <Td>{item.startDate ? formatDate(item.startDate) : '-'}</Td>
      <Td>{item.endDate ? formatDate(item.endDate) : '-'}</Td>
    </Tr>
  );

  return (
    <Box>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      {/* Filters */}
      <Card mb={8}>
        <CardHeader pb={0}>
          <Heading as="h2" size="md">{t('dashboard.filters.title')}</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <FormControl>
              <FormLabel>{t('dashboard.filters.startDate')}</FormLabel>
              <Input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('dashboard.filters.endDate')}</FormLabel>
              <Input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('dashboard.filters.brand')}</FormLabel>
              <Select
                name="brandId"
                value={filters.brandId}
                onChange={handleFilterChange}
                placeholder={t('dashboard.filters.allBrands')}
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>{t('dashboard.filters.category')}</FormLabel>
              <Select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder={t('dashboard.filters.allCategories')}
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
              {t('dashboard.filters.reset')}
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* KPI cards */}
      <Heading as="h2" size="md" mb={4}>{t('dashboard.overview.title')}</Heading>
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
              label={t('dashboard.overview.applicationsSent')}
              value={stats.totalApplicationsSent}
            />
            <StatCard
              icon={FiClock}
              label={t('dashboard.overview.activeApplications')}
              value={stats.pendingApplications}
            />
            <StatCard
              icon={FiCheckCircle}
              label={t('dashboard.overview.acceptedRejected')}
              value={`${stats.acceptedApplications} / ${stats.rejectedApplications}`}
              helpText={t('dashboard.overview.withdrawn', { value: stats.withdrawnApplications })}
            />
            <StatCard
              icon={FiUsers}
              label={t('dashboard.overview.collaborations')}
              value={stats.totalMatches}
              helpText={t('dashboard.overview.completed', { value: stats.completedMatches })}
            />
          </>
        )}
      </SimpleGrid>

      <Heading as="h2" size="md" mb={4}>{t('dashboard.metrics.title')}</Heading>
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
              label={t('dashboard.metrics.totalClicks')}
              value={formatNumber(stats.totalClicks)}
            />
            <StatCard
              icon={FiEye}
              label={t('dashboard.metrics.totalImpressions')}
              value={formatNumber(stats.totalImpressions)}
            />
            <StatCard
              icon={FiTrendingUp}
              label={t('dashboard.metrics.avgEngagementRate')}
              value={`${stats.averageEngagementRate.toFixed(2)}%`}
            />
            <StatCard
              icon={FiUserPlus}
              label={t('dashboard.metrics.followerGrowth')}
              value={`+${formatNumber(stats.followerGrowth)}`}
            />
          </>
        )}
      </SimpleGrid>

      {/* Charts and table */}
      {!isLoading && stats && (
        <>
          <Heading as="h2" size="md" mb={4}>{t('dashboard.details.title')}</Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
            <Card>
              <CardHeader pb={0}><Heading as="h3" size="sm">{t('dashboard.details.performanceOverTime')}</Heading></CardHeader>
              <CardBody>
                {stats.dailyStats && stats.dailyStats.length > 0 ? (
                  <LineChart data={stats.dailyStats} dataKey="engagementRate" />
                ) : (
                  <Text color="fg.muted">{t('dashboard.details.noDailyData')}</Text>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader pb={0}><Heading as="h3" size="sm">{t('dashboard.details.impressionsByCategory')}</Heading></CardHeader>
              <CardBody>
                {stats.campaignStats && stats.campaignStats.length > 0 ? (
                  <PieChart data={stats.campaignStats} nameKey="category" dataKey="impressions" />
                ) : (
                  <Text color="fg.muted">{t('dashboard.details.noCampaignData')}</Text>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card>
            <CardHeader pb={0}><Heading as="h3" size="sm">{t('dashboard.details.collaborationPerformance')}</Heading></CardHeader>
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
                  title={t('dashboard.details.emptyTitle')}
                  description={t('dashboard.details.emptyDescription')}
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
