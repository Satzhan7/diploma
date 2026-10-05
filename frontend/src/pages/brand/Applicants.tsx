import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  useToast,
  VisuallyHidden,
} from '@chakra-ui/react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiLock, FiUsers } from 'react-icons/fi';
import { Applicant, applicationsService } from '../../services/applications';
import { Brief, briefsService } from '../../services/briefs';
import { nextSkip } from '../../services/page';
import { planService } from '../../services/plan';
import { publicFileUrl } from '../../services/files';
import { formatMoney, formatNumber, formatPercent } from '../../i18n';
import { getErrorCode, getErrorMessage } from '../../i18n/errors';
import { useBriefText } from '../../components/useBriefText';
import {
  CardGridSkeleton,
  CreatorCard,
  EmptyState,
  PageHeader,
  ScoreRing,
  SegmentedControl,
  StatusBadge,
  StatusPill,
} from '../../components/ui';

const PAGE_SIZE = 24;

type View = 'feed' | 'compare' | 'focus';

/** `/brand/applicants`: open the newest live brief, or say there is none. */
export const LatestApplicants: React.FC = () => {
  const { t } = useBriefText();
  const live = useQuery({
    queryKey: ['briefs', 'mine', 'latest-open'],
    queryFn: () => briefsService.listMine({ status: ['open'], take: 1 }),
  });
  if (live.isPending) return <CardGridSkeleton />;
  const latest = live.data?.items[0];
  if (latest) return <Navigate to={`/brand/briefs/${latest.id}/applicants`} replace />;
  return (
    <EmptyState
      icon={FiUsers}
      title={t('applicants.noBrief.title')}
      description={t('applicants.noBrief.description')}
      action={
        <Button as={RouterLink} to="/brand/briefs/new" colorScheme="brand">
          {t('list.new')}
        </Button>
      }
    />
  );
};

export const Applicants: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const text = useBriefText();
  const { t } = text;
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('feed');
  const [focusIndex, setFocusIndex] = useState(0);
  const [accepting, setAccepting] = useState<Applicant | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // "Verified only" is Pro; the server refuses it to Free (PLAN_PRO_REQUIRED).
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const plan = useQuery({ queryKey: ['plan', 'me'], queryFn: planService.mine });
  const isPro = plan.data?.plan === 'pro';
  const brief = useQuery({ queryKey: ['briefs', 'detail', id], queryFn: () => briefsService.get(id) });
  const feed = useInfiniteQuery({
    queryKey: ['applicants', id, verifiedOnly ? 'verified' : 'all'],
    queryFn: ({ pageParam }) =>
      applicationsService.forBrief(id, { take: PAGE_SIZE, skip: pageParam, verifiedOnly: verifiedOnly || undefined }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
  });
  const shortlist = useQuery({
    queryKey: ['applicants', id, 'shortlist', verifiedOnly],
    queryFn: () =>
      applicationsService.forBrief(id, { shortlisted: true, take: 100, verifiedOnly: verifiedOnly || undefined }),
    enabled: view === 'compare',
  });

  // The plan can end while the page is open: fall back and offer the upgrade.
  const planRefused = getErrorCode(feed.error) === 'PLAN_PRO_REQUIRED';
  useEffect(() => {
    if (!planRefused) return;
    setVerifiedOnly(false);
    setUpgradeOpen(true);
    queryClient.invalidateQueries({ queryKey: ['plan'] });
  }, [planRefused, queryClient]);

  // Offset paging can repeat a row when ranks shift between pages; keep the first copy.
  const applicants = useMemo(() => {
    const seen = new Set<string>();
    return (feed.data?.pages.flatMap((p) => p.items) ?? []).filter((a) => !seen.has(a.id) && !!seen.add(a.id));
  }, [feed.data]);
  const total = feed.data?.pages[0]?.total ?? 0;
  const isOpen = brief.data?.status === 'open';

  useEffect(() => {
    if (focusIndex >= applicants.length && applicants.length) setFocusIndex(0);
  }, [applicants.length, focusIndex]);

  const toggle = useMutation({
    mutationFn: (a: Applicant) => applicationsService.shortlist(a.id, !a.shortlisted),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['applicants', id] });
      toast({
        status: 'success',
        title: t(result.shortlisted ? 'applicants.toasts.shortlisted' : 'applicants.toasts.removed'),
        duration: 2000,
      });
    },
    onError: (error) => toast({ status: 'error', title: getErrorMessage(error) }),
  });

  const accept = useMutation({
    mutationFn: (a: Applicant) => applicationsService.decide(a.id, 'accepted'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['applicants', id] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ status: 'success', title: t('applicants.toasts.accepted') });
      navigate(result.dealId ? `/brand/deals/${result.dealId}` : '/brand/deals');
    },
    onError: (error) => toast({ status: 'error', title: getErrorMessage(error) }),
    onSettled: () => setAccepting(null),
  });

  if (brief.isError) {
    return (
      <EmptyState
        title={getErrorMessage(brief.error)}
        action={
          <Button as={RouterLink} to="/brand/briefs">
            {t('wizard.backToBriefs')}
          </Button>
        }
      />
    );
  }

  const stats = (a: Applicant) => [
    {
      label: t('applicants.stats.followers'),
      value: a.creator.followersCount != null ? formatNumber(a.creator.followersCount) : '—',
    },
    {
      label: t('applicants.stats.er'),
      value: a.creator.engagementRate != null ? formatPercent(a.creator.engagementRate / 100) : '—',
    },
  ];
  const caption = (a: Applicant) =>
    [a.creator.location, ...a.creator.categories.slice(0, 2).map(text.category)].filter(Boolean).join(' · ');
  const price = (a: Applicant) =>
    a.proposedPrice != null ? formatMoney(a.proposedPrice) : ((brief.data && text.budget(brief.data)) ?? '—');
  const priceCaption = (a: Applicant) => t(a.proposedPrice != null ? 'applicants.asks' : 'applicants.noPrice');
  const scoreLabel = (a: Applicant) => t('applicants.score', { value: a.score.total });

  const actionsFor = (a: Applicant, compact = false) =>
    a.status !== 'pending' ? (
      <StatusBadge status={a.status} />
    ) : isOpen ? (
      <HStack spacing={2}>
        <Button
          size="sm"
          variant={a.shortlisted ? 'solid' : 'outline'}
          aria-pressed={a.shortlisted}
          onClick={() => toggle.mutate(a)}
          isLoading={toggle.isPending && toggle.variables?.id === a.id}
        >
          {t(a.shortlisted ? 'applicants.shortlisted' : 'applicants.shortlist')}
        </Button>
        <Button size="sm" colorScheme="brand" onClick={() => setAccepting(a)}>
          {t('applicants.accept')}
        </Button>
      </HStack>
    ) : compact ? null : (
      <StatusBadge status={a.status} />
    );

  const header = brief.data && (
    <Stack spacing={1}>
      <Link
        as={RouterLink}
        to="/brand/briefs"
        fontSize="sm"
        color="fg.muted"
        display="inline-flex"
        gap={1}
        alignItems="center"
      >
        <FiArrowLeft aria-hidden /> {t('applicants.crumb')}
      </Link>
      <PageHeader
        title={feed.isPending ? brief.data.title : t('applicants.title', { count: total })}
        subtitle={[
          brief.data.title,
          brief.data.platform && t(`platform.${brief.data.platform}`),
          text.budget(brief.data),
          t('applicants.ranked'),
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          isPro ? (
            <Button
              variant={verifiedOnly ? 'solid' : 'outline'}
              aria-pressed={verifiedOnly}
              leftIcon={verifiedOnly ? <FiCheck aria-hidden /> : undefined}
              onClick={() => setVerifiedOnly((on) => !on)}
            >
              {t('applicants.verifiedOnly')}
            </Button>
          ) : (
            <Tooltip label={t('applicants.proHint')} hasArrow>
              <Button
                variant="outline"
                leftIcon={<FiLock aria-hidden />}
                isDisabled={plan.isPending}
                onClick={() => setUpgradeOpen(true)}
                rightIcon={<StatusPill tone="primary">{t('applicants.pro')}</StatusPill>}
              >
                {t('applicants.verifiedOnly')}
              </Button>
            </Tooltip>
          )
        }
      />
    </Stack>
  );

  const renderFeed = () => (
    <>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
        {applicants.map((a) => (
          <CreatorCard
            key={a.id}
            name={a.creator.name}
            avatarUrl={a.creator.avatarUrl}
            caption={caption(a)}
            verified={a.creator.verified}
            score={a.score.total}
            scoreLabel={scoreLabel(a)}
            stats={stats(a)}
            quote={a.message}
            price={price(a)}
            priceCaption={priceCaption(a)}
            stripLabel={
              a.creator.portfolio.length ? t('applicants.stripOf', { name: a.creator.name }) : t('applicants.strip')
            }
            images={a.creator.portfolio.map((fileId, i) => ({
              src: publicFileUrl(fileId),
              alt: t('applicants.portfolioAlt', { n: i + 1, name: a.creator.name }),
            }))}
            highlighted={a.shortlisted}
            actions={actionsFor(a)}
          />
        ))}
      </SimpleGrid>
      <Center flexDirection="column" gap={2}>
        <Text fontSize="sm" color="fg.muted">
          {t('list.count', { shown: applicants.length, total })}
        </Text>
        {feed.hasNextPage && (
          <Button variant="outline" onClick={() => feed.fetchNextPage()} isLoading={feed.isFetchingNextPage}>
            {t('list.more')}
          </Button>
        )}
      </Center>
    </>
  );

  const renderCompare = () => {
    if (shortlist.isPending) return <CardGridSkeleton />;
    const list = shortlist.data?.items ?? [];
    if (!list.length) {
      return <EmptyState icon={FiUsers} title={t('applicants.compareEmpty')} />;
    }
    // Best value per row gets the accent (lowest price, highest the rest).
    const best = (values: (number | null)[], high: boolean) => {
      const known = values.filter((v): v is number => v != null);
      if (known.length < 2) return values.map(() => false);
      const target = high ? Math.max(...known) : Math.min(...known);
      return values.map((v) => v === target);
    };
    const rows: { label: string; cells: string[]; best?: boolean[] }[] = [
      {
        label: t('applicants.rows.match'),
        cells: list.map((a) => String(a.score.total)),
        best: best(
          list.map((a) => a.score.total),
          true,
        ),
      },
      {
        label: t('applicants.stats.followers'),
        cells: list.map((a) => stats(a)[0].value),
        best: best(
          list.map((a) => a.creator.followersCount),
          true,
        ),
      },
      {
        label: t('applicants.stats.er'),
        cells: list.map((a) => stats(a)[1].value),
        best: best(
          list.map((a) => a.creator.engagementRate),
          true,
        ),
      },
      {
        label: t('applicants.rows.price'),
        cells: list.map(price),
        best: best(
          list.map((a) => a.proposedPrice),
          false,
        ),
      },
      { label: t('applicants.rows.city'), cells: list.map((a) => a.creator.location || '—') },
      {
        label: t('applicants.rows.languages'),
        cells: list.map((a) => a.creator.languages.join(', ') || '—'),
      },
      {
        label: t('applicants.rows.verified'),
        cells: list.map((a) => t(a.creator.verified ? 'applicants.yes' : 'applicants.no')),
      },
    ];
    return (
      <Box layerStyle="card" overflowX="auto" p={0}>
        <Box as="table" w="full" minW={`${160 + list.length * 160}px`} sx={{ borderCollapse: 'collapse' }}>
          <Box as="caption" textAlign="left" px={4} pt={4} fontSize="sm" color="fg.muted">
            {t('applicants.compareCaption')}
          </Box>
          <Box as="thead">
            <Box as="tr">
              <Box as="th" scope="col" w="160px">
                <VisuallyHidden>{t('applicants.compareMetric')}</VisuallyHidden>
              </Box>
              {list.map((a) => (
                <Box as="th" key={a.id} scope="col" p={4} textAlign="left" verticalAlign="top">
                  <Text fontWeight="700" noOfLines={1}>
                    {a.creator.name}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" fontWeight="400" noOfLines={1}>
                    {a.creator.location}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>
          <Box as="tbody">
            {rows.map((row) => (
              <Box as="tr" key={row.label} borderTopWidth="1px" borderColor="border.default">
                <Box as="th" scope="row" px={4} py={3} textAlign="left" fontSize="sm" color="fg.muted" fontWeight="500">
                  {row.label}
                </Box>
                {row.cells.map((cell, i) => (
                  <Box
                    as="td"
                    key={list[i].id}
                    px={4}
                    py={3}
                    fontSize="sm"
                    fontWeight={row.best?.[i] ? '700' : '500'}
                    color={row.best?.[i] ? 'success.fg' : 'fg.default'}
                    bg={row.best?.[i] ? 'success.soft' : 'transparent'}
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {cell}
                  </Box>
                ))}
              </Box>
            ))}
            <Box as="tr" borderTopWidth="1px" borderColor="border.default">
              <Box as="td" />
              {list.map((a) => (
                <Box as="td" key={a.id} p={4}>
                  {a.status === 'pending' && isOpen ? (
                    <Button size="sm" colorScheme="brand" onClick={() => setAccepting(a)}>
                      {t('applicants.accept')}
                    </Button>
                  ) : (
                    <StatusBadge status={a.status} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderFocus = () => {
    const a = applicants[focusIndex];
    if (!a) return null;
    const next = () => setFocusIndex((i) => (i + 1) % applicants.length);
    return (
      <Flex
        layerStyle="card"
        direction={{ base: 'column', md: 'row' }}
        overflow="hidden"
        maxW="880px"
        w="full"
        mx="auto"
      >
        <Box
          flex="1"
          minH={{ base: '220px', md: '360px' }}
          bg="bg.subtle"
          position="relative"
          p={5}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Text fontSize="sm" color="fg.muted" alignSelf="flex-end" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {t('applicants.position', { n: focusIndex + 1, total: applicants.length })}
          </Text>
          <HStack justify="space-between" align="flex-end" spacing={3}>
            <Box minW={0}>
              <Text textStyle="display" fontSize="2xl" noOfLines={1}>
                {a.creator.name}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {[...stats(a).map((s) => `${s.value} ${s.label}`), a.creator.location].filter(Boolean).join(' · ')}
              </Text>
            </Box>
            <ScoreRing value={a.score.total} size={56} label={scoreLabel(a)} />
          </HStack>
        </Box>
        <Stack flex="1" p={{ base: 4, md: 6 }} spacing={4}>
          <Text fontSize="md" overflowWrap="anywhere">
            “{a.message}”
          </Text>
          <HStack justify="space-between">
            <Text color="fg.muted">{priceCaption(a)}</Text>
            <Text fontWeight="700" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {price(a)}
            </Text>
          </HStack>
          <Flex gap={2} wrap="wrap" mt="auto">
            <Button variant="ghost" onClick={next}>
              {t('applicants.pass')}
            </Button>
            {a.status === 'pending' && isOpen ? (
              <>
                <Button
                  variant="outline"
                  aria-pressed={a.shortlisted}
                  onClick={() => toggle.mutate(a, { onSuccess: next })}
                  isLoading={toggle.isPending}
                >
                  {t(a.shortlisted ? 'applicants.shortlisted' : 'applicants.shortlist')}
                </Button>
                <Button colorScheme="brand" onClick={() => setAccepting(a)}>
                  {t('applicants.accept')}
                </Button>
              </>
            ) : (
              <StatusBadge status={a.status} alignSelf="center" />
            )}
          </Flex>
        </Stack>
      </Flex>
    );
  };

  return (
    <Stack spacing={6}>
      {header}

      <SegmentedControl<View>
        label={t('applicants.viewsLabel')}
        value={view}
        onChange={setView}
        segments={[
          { value: 'feed', label: t('applicants.views.feed') },
          { value: 'compare', label: t('applicants.views.compare') },
          { value: 'focus', label: t('applicants.views.focus') },
        ]}
      />

      {brief.data && !isOpen && (
        <Text fontSize="sm" color="fg.muted" role="status">
          {t('applicants.closed', { status: t(`common:status.${brief.data.status.replace('-', '_')}`) })}
        </Text>
      )}

      {feed.isPending || brief.isPending ? (
        <CardGridSkeleton />
      ) : feed.isError ? (
        <EmptyState
          title={getErrorMessage(feed.error)}
          action={<Button onClick={() => feed.refetch()}>{t('common:actions.retry')}</Button>}
        />
      ) : applicants.length === 0 ? (
        verifiedOnly ? (
          <EmptyState icon={FiUsers} title={t('applicants.verifiedEmpty')} />
        ) : (
          <EmptyState icon={FiUsers} title={t('applicants.empty.title')} description={t(briefEmptyKey(brief.data))} />
        )
      ) : view === 'feed' ? (
        renderFeed()
      ) : view === 'compare' ? (
        renderCompare()
      ) : (
        renderFocus()
      )}

      <Modal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>{t('applicants.upgrade.title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{t('applicants.upgrade.body')}</Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={() => setUpgradeOpen(false)}>
              {t('applicants.upgrade.close')}
            </Button>
            <Button as={RouterLink} to="/brand/plan" colorScheme="brand">
              {t('applicants.upgrade.cta')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={!!accepting} leastDestructiveRef={cancelRef} onClose={() => setAccepting(null)}>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>
              {t('applicants.acceptDialog.title', { name: accepting?.creator.name })}
            </AlertDialogHeader>
            <AlertDialogBody>{t('applicants.acceptDialog.body')}</AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} variant="ghost" onClick={() => setAccepting(null)}>
                {t('applicants.acceptDialog.cancel')}
              </Button>
              <Button
                colorScheme="brand"
                onClick={() => accepting && accept.mutate(accepting)}
                isLoading={accept.isPending}
              >
                {t('applicants.acceptDialog.confirm')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Stack>
  );
};

const briefEmptyKey = (brief?: Brief) =>
  brief?.status === 'draft' ? 'applicants.empty.draft' : 'applicants.empty.description';
