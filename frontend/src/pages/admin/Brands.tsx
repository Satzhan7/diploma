import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
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
import { CardGridSkeleton, EmptyState, PageHeader, StatusPill } from '../../components/ui';

const PAGE_SIZE = 20;

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
    <Stack spacing={6}>
      <PageHeader title={t('brands.title')} subtitle={t('brands.subtitle')} />
      {testPeriod && (
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>{t('brands.testNote')}</AlertDescription>
        </Alert>
      )}
      <InputGroup maxW="420px">
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
          <Stack spacing={3}>
            {items.map((brand) => (
              <BrandRow key={brand.profileId} brand={brand} />
            ))}
          </Stack>
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
    </Stack>
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
    <Flex
      as="form"
      noValidate
      aria-labelledby={`${idBase}-name`}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        save.mutate();
      }}
      layerStyle="card"
      p={{ base: 4, md: 5 }}
      gap={4}
      direction={{ base: 'column', lg: 'row' }}
      align={{ base: 'stretch', lg: 'flex-end' }}
    >
      <Box flex="1" minW={0}>
        <Heading id={`${idBase}-name`} as="h2" fontSize="md" noOfLines={1}>
          {name}
        </Heading>
        <Text fontSize="sm" color="fg.muted" noOfLines={1}>
          {brand.email}
        </Text>
        <StatusPill tone={brand.plan === 'pro' ? 'primary' : 'neutral'} mt={2}>
          {t('brands.now', { plan: brand.plan === 'pro' ? 'Pro' : 'Free' })}
        </StatusPill>
      </Box>
      <FormControl w={{ base: 'full', lg: '140px' }}>
        <FormLabel htmlFor={`${idBase}-plan`} fontSize="sm">
          {t('brands.plan')}
        </FormLabel>
        <Select id={`${idBase}-plan`} value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </Select>
      </FormControl>
      <FormControl w={{ base: 'full', lg: '200px' }} isDisabled={plan !== 'pro'} isInvalid={!!errors.proExpiresAt}>
        <FormLabel htmlFor={`${idBase}-until`} fontSize="sm">
          {t('brands.until')}
        </FormLabel>
        <Input id={`${idBase}-until`} type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        {!errors.proExpiresAt && plan === 'pro' && !until && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {t('brands.noEnd')}
          </Text>
        )}
        <FormErrorMessage>{errors.proExpiresAt}</FormErrorMessage>
      </FormControl>
      <Button type="submit" colorScheme="brand" isLoading={save.isPending} flexShrink={0}>
        {t('brands.save')}
      </Button>
    </Flex>
  );
};
