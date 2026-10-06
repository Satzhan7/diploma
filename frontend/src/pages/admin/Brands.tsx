import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiBriefcase, FiSearch } from 'react-icons/fi';
import { AdminBrand, adminService } from '../../services/admin';
import type { Plan } from '../../services/plan';
import { nextSkip } from '../../services/page';
import { getErrorMessage, getFieldErrors } from '../../i18n/errors';
import { CardGridSkeleton, EmptyState, PageContainer, PageHeader, StatusPill } from '../../components/ui';

const PAGE_SIZE = 20;

// Compact admin density (docs/PROJECT.md §7): one header row, 32 px controls on desktop.
// Columns: brand, plan, Pro until, save.
const COLUMNS = { base: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 8rem 11rem auto' };
// Field labels stay for screen readers on desktop, where the header row shows them.
const srOnlyOnDesktop = {
  '@media screen and (min-width: 64em)': {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
};

/** yyyy-mm-dd for a date input; the end of that day in the browser's zone goes to the API. */
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');
const fromDateInput = (value: string) => (value ? new Date(`${value}T23:59:59`).toISOString() : null);

/** `/admin/brands`: set Pro after a Kaspi transfer; it applies on the brand's next request. */
export const Brands: React.FC = () => {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ['admin', 'brands', debounced],
    queryFn: ({ pageParam }) =>
      adminService.brands({ search: debounced || undefined, take: PAGE_SIZE, skip: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const testPeriod = items[0]?.freeTestPeriod;

  return (
    <PageContainer>
      <PageHeader title={t('brands.title')} subtitle={t('brands.subtitle')} />
      {testPeriod && (
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>{t('brands.testNote')}</AlertDescription>
        </Alert>
      )}
      <InputGroup maxW={{ md: 'md' }}>
        <InputLeftElement pointerEvents="none" color="fg.muted">
          <FiSearch aria-hidden />
        </InputLeftElement>
        <Input
          type="search"
          aria-label={t('brands.search')}
          placeholder={t('brands.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      {query.isPending ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={getErrorMessage(query.error)}
          action={<Button onClick={() => query.refetch()}>{t('common:actions.retry')}</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={FiBriefcase} title={t('brands.empty')} />
      ) : (
        <>
          <Box layerStyle="card" overflow="hidden">
            <Grid
              display={{ base: 'none', lg: 'grid' }}
              templateColumns={COLUMNS}
              gap={4}
              px={4}
              py={2}
              bg="bg.subtle"
              textStyle="label"
              color="fg.muted"
              aria-hidden
            >
              <Text>{t('brands.columnBrand')}</Text>
              <Text>{t('brands.plan')}</Text>
              <Text>{t('brands.until')}</Text>
            </Grid>
            {items.map((brand) => (
              <BrandRow key={brand.profileId} brand={brand} />
            ))}
          </Box>
          <Center flexDirection="column" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {t('list.count', { shown: items.length, total })}
            </Text>
            {query.hasNextPage && (
              <Button variant="outline" onClick={() => query.fetchNextPage()} isLoading={query.isFetchingNextPage}>
                {t('list.more')}
              </Button>
            )}
          </Center>
        </>
      )}
    </PageContainer>
  );
};

const BrandRow: React.FC<{ brand: AdminBrand }> = ({ brand }) => {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState<Plan>(brand.storedPlan);
  const [until, setUntil] = useState(toDateInput(brand.proExpiresAt));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const idBase = `brand-${brand.profileId}`;

  useEffect(() => {
    setPlan(brand.storedPlan);
    setUntil(toDateInput(brand.proExpiresAt));
  }, [brand.storedPlan, brand.proExpiresAt]);

  const save = useMutation({
    mutationFn: () =>
      adminService.setPlan(brand.profileId, { plan, proExpiresAt: plan === 'pro' ? fromDateInput(until) : null }),
    onSuccess: (updated) => {
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
      toast({ status: 'success', title: t('brands.toasts.saved', { name: updated.companyName || updated.name }) });
    },
    onError: (error) => {
      const fields = getFieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) toast({ status: 'error', title: getErrorMessage(error) });
    },
  });

  const name = brand.companyName || brand.name;
  return (
    <Grid
      as="form"
      noValidate
      aria-labelledby={`${idBase}-name`}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        save.mutate();
      }}
      templateColumns={COLUMNS}
      gap={{ base: 3, lg: 4 }}
      alignItems={{ lg: 'center' }}
      px={4}
      py={{ base: 4, lg: 2 }}
      borderTopWidth="1px"
      borderColor="border.default"
      _first={{ borderTopWidth: { base: 0, lg: '1px' } }}
    >
      <Box minW={0}>
        <HStack spacing={2} minW={0}>
          <Heading id={`${idBase}-name`} as="h2" size="xs" noOfLines={1}>
            {name}
          </Heading>
          <StatusPill tone={brand.plan === 'pro' ? 'primary' : 'neutral'} flexShrink={0}>
            {t('brands.now', { plan: brand.plan === 'pro' ? 'Pro' : 'Free' })}
          </StatusPill>
        </HStack>
        <Text textStyle="small" color="fg.muted" noOfLines={1}>
          {brand.email}
        </Text>
      </Box>
      <FormControl>
        <FormLabel htmlFor={`${idBase}-plan`} textStyle="label" sx={srOnlyOnDesktop}>
          {t('brands.plan')}
        </FormLabel>
        <Select
          id={`${idBase}-plan`}
          size={{ base: 'md', lg: 'sm' }}
          value={plan}
          onChange={(e) => setPlan(e.target.value as Plan)}
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </Select>
      </FormControl>
      <FormControl isDisabled={plan !== 'pro'} isInvalid={!!errors.proExpiresAt}>
        <FormLabel htmlFor={`${idBase}-until`} textStyle="label" sx={srOnlyOnDesktop}>
          {t('brands.until')}
        </FormLabel>
        <Input
          id={`${idBase}-until`}
          type="date"
          size={{ base: 'md', lg: 'sm' }}
          value={until}
          onChange={(e) => setUntil(e.target.value)}
        />
        {!errors.proExpiresAt && plan === 'pro' && !until && (
          <Text textStyle="caption" color="fg.muted" mt={1}>
            {t('brands.noEnd')}
          </Text>
        )}
        <FormErrorMessage>{errors.proExpiresAt}</FormErrorMessage>
      </FormControl>
      <Button type="submit" colorScheme="brand" size={{ base: 'md', lg: 'sm' }} isLoading={save.isPending}>
        {t('brands.save')}
      </Button>
    </Grid>
  );
};
