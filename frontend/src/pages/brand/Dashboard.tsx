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
import { useTranslation } from 'react-i18next';
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
import { formatDate, formatNumber } from '../../i18n';

export const BrandDashboard: React.FC = () => {
  const { t } = useTranslation('brand');
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
        toast({ title: t('dashboard.errors.loadInfluencers'), status: 'error' });
      }

      try {
        const categoriesResponse = await api.get<string[]>('/categories');
        setCategories(categoriesResponse.data);
      } catch {
        toast({ title: t('dashboard.errors.loadCategories'), status: 'error' });
      }
    };

    fetchFiltersData();
  }, [toast, t]);

  useEffect(() => {
    if (error) {
      toast({
        title: t('common:state.error'),
        description: t('dashboard.errors.loadStats'),
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
      influencerId: '',
      category: '',
    });
  };

  const campaignTableHeaders = [
    t('dashboard.table.campaign'),
    t('dashboard.table.category'),
    t('dashboard.table.influencer'),
    t('dashboard.table.clicks'),
    t('dashboard.table.impressions'),
    t('dashboard.table.engagement'),
    t('dashboard.table.status'),
    t('dashboard.table.startDate'),
    t('dashboard.table.endDate'),
  ];

  // Categories come from the API as English labels; show them translated.
  const categoryLabel = (category: string) =>
    t(`categories.${category.toLowerCase()}`, { defaultValue: category });

  const renderCampaignRow = (item: CampaignStat) => (
    <Tr key={item.id}>
      <Td>{item.name || t('notAvailable')}</Td>
      <Td>{item.category ? categoryLabel(item.category) : t('notAvailable')}</Td>
      <Td>
        {item.influencerId ? (
          <Link as={RouterLink} to={`/brand/profile/${item.influencerId}`} color="accent.solid">
            {item.influencerName || t('notAvailable')}
          </Link>
        ) : (
          item.influencerName || t('notAvailable')
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
              <FormLabel>{t('dashboard.filters.influencer')}</FormLabel>
              <Select
                name="influencerId"
                value={filters.influencerId}
                onChange={handleFilterChange}
                placeholder={t('dashboard.filters.allInfluencers')}
              >
                {influencers.map(influencer => (
                  <option key={influencer.id} value={influencer.id}>
                    {influencer.name}
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
                    {categoryLabel(category)}
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
              icon={FiList}
              label={t('dashboard.overview.ordersCreated')}
              value={stats.totalOrdersCreated}
            />
            <StatCard
              icon={FiActivity}
              label={t('dashboard.overview.activeOrders')}
              value={stats.openOrders + stats.inProgressOrders}
              helpText={t('dashboard.overview.activeOrdersHelp', { open: stats.openOrders, inProgress: stats.inProgressOrders })}
            />
            <StatCard
              icon={FiInbox}
              label={t('dashboard.overview.applicationsReceived')}
              value={stats.totalApplicationsReceived}
              helpText={t('dashboard.overview.applicationsHelp', { pending: stats.pendingApplications, accepted: stats.acceptedApplications })}
            />
            <StatCard
              icon={FiUsers}
              label={t('dashboard.overview.activeCollaborations')}
              value={stats.totalMatches - stats.completedMatches}
              helpText={t('dashboard.overview.collaborationsHelp', { completed: stats.completedMatches })}
            />
          </>
        )}
      </SimpleGrid>

      <Heading as="h2" size="md" mb={4}>{t('dashboard.performance.title')}</Heading>
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
              label={t('dashboard.performance.totalClicks')}
              value={formatNumber(stats.totalClicks)}
            />
            <StatCard
              icon={FiEye}
              label={t('dashboard.performance.totalImpressions')}
              value={formatNumber(stats.totalImpressions)}
            />
            <StatCard
              icon={FiTrendingUp}
              label={t('dashboard.performance.avgEngagement')}
              value={`${stats.averageEngagementRate.toFixed(2)}%`}
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
              <CardHeader pb={0}><Heading as="h3" size="sm">{t('dashboard.details.overTime')}</Heading></CardHeader>
              <CardBody>
                {stats.dailyStats && stats.dailyStats.length > 0 ? (
                  <LineChart data={stats.dailyStats} dataKey="clicks" />
                ) : (
                  <Text color="fg.muted">{t('dashboard.details.noDailyData')}</Text>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader pb={0}><Heading as="h3" size="sm">{t('dashboard.details.byCategory')}</Heading></CardHeader>
              <CardBody>
                {stats.campaignStats && stats.campaignStats.length > 0 ? (
                  <PieChart
                    data={stats.campaignStats.map((c) => ({ ...c, category: c.category && categoryLabel(c.category) }))}
                    nameKey="category"
                    dataKey="engagementRate"
                  />
                ) : (
                  <Text color="fg.muted">{t('dashboard.details.noCampaignData')}</Text>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card>
            <CardHeader pb={0}><Heading as="h3" size="sm">{t('dashboard.details.campaigns')}</Heading></CardHeader>
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
                  title={t('dashboard.empty.title')}
                  description={t('dashboard.empty.description')}
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
