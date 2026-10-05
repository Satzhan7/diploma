import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Center,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { FiFileText, FiPlus } from 'react-icons/fi';
import { Brief, BriefStatus, briefsService } from '../../services/briefs';
import { nextSkip } from '../../services/page';
import { getErrorMessage } from '../../i18n/errors';
import { formatDate } from '../../i18n';
import { useBriefText } from '../../components/useBriefText';
import {
  BriefCard,
  CardGridSkeleton,
  EmptyState,
  PageHeader,
  SegmentedControl,
  StatusBadge,
} from '../../components/ui';

const PAGE_SIZE = 20;

type Filter = 'all' | 'open' | 'draft' | 'inProgress' | 'closed';

const FILTER_STATUSES: Record<Filter, BriefStatus[]> = {
  all: [],
  open: ['open'],
  draft: ['draft'],
  inProgress: ['in-progress', 'review'],
  closed: ['completed', 'cancelled'],
};

export const Briefs: React.FC = () => {
  const text = useBriefText();
  const { t } = text;
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [cancelling, setCancelling] = useState<Brief | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const query = useInfiniteQuery({
    queryKey: ['briefs', 'mine', filter],
    queryFn: ({ pageParam }) =>
      briefsService.listMine({ take: PAGE_SIZE, skip: pageParam, status: FILTER_STATUSES[filter] }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
  });
  const briefs = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  const onDone = (key: 'published' | 'cancelled') => () => {
    queryClient.invalidateQueries({ queryKey: ['briefs'] });
    toast({ status: 'success', title: t(`list.toasts.${key}`) });
  };
  const onFail = (error: unknown) => toast({ status: 'error', title: getErrorMessage(error) });
  const publish = useMutation({ mutationFn: briefsService.publish, onSuccess: onDone('published'), onError: onFail });
  const cancel = useMutation({
    mutationFn: briefsService.cancel,
    onSuccess: onDone('cancelled'),
    onError: onFail,
    onSettled: () => setCancelling(null),
  });

  const actionsFor = (brief: Brief) => {
    const applicants = (
      <Button as={RouterLink} to={`/brand/briefs/${brief.id}/applicants`} colorScheme="brand" size="sm">
        {t('list.actions.applicants', { count: brief.applicationsCount ?? 0 })}
      </Button>
    );
    const edit = (
      <Button as={RouterLink} to={`/brand/briefs/${brief.id}/edit`} variant="outline" size="sm">
        {t('list.actions.edit')}
      </Button>
    );
    const cancelButton = (
      <Button variant="ghost" size="sm" onClick={() => setCancelling(brief)}>
        {t('list.actions.cancel')}
      </Button>
    );
    if (brief.status === 'draft') {
      return (
        <HStack spacing={2} wrap="wrap" justify="flex-end">
          {cancelButton}
          {edit}
          <Button
            colorScheme="brand"
            size="sm"
            onClick={() => publish.mutate(brief.id)}
            isLoading={publish.isPending && publish.variables === brief.id}
          >
            {t('list.actions.publish')}
          </Button>
        </HStack>
      );
    }
    if (brief.status === 'open') {
      return (
        <HStack spacing={2} wrap="wrap" justify="flex-end">
          {cancelButton}
          {edit}
          {applicants}
        </HStack>
      );
    }
    return applicants;
  };

  const caption = (brief: Brief) => {
    if (brief.status === 'open' && brief.pendingCount) return t('list.newApplicants', { count: brief.pendingCount });
    return brief.postBy ? t('list.postBy', { date: formatDate(brief.postBy) }) : t('list.noDate');
  };

  return (
    <Stack spacing={6}>
      <PageHeader
        title={t('list.title')}
        subtitle={t('list.subtitle')}
        actions={
          <Button as={RouterLink} to="/brand/briefs/new" colorScheme="brand" leftIcon={<FiPlus />}>
            {t('list.new')}
          </Button>
        }
      />

      <SegmentedControl<Filter>
        label={t('list.filterLabel')}
        value={filter}
        onChange={setFilter}
        overflowX="auto"
        segments={(Object.keys(FILTER_STATUSES) as Filter[]).map((value) => ({
          value,
          label: t(`list.filter.${value}`),
        }))}
      />

      {query.isPending ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={t('list.loadError')}
          action={<Button onClick={() => query.refetch()}>{t('common:actions.retry')}</Button>}
        />
      ) : briefs.length === 0 ? (
        <EmptyState
          icon={FiFileText}
          title={t('list.empty.title')}
          description={t('list.empty.description')}
          action={
            <Button as={RouterLink} to="/brand/briefs/new" colorScheme="brand">
              {t('list.new')}
            </Button>
          }
        />
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {briefs.map((brief) => (
              <BriefCard
                key={brief.id}
                partyName={brief.brand?.name ?? ''}
                partyAvatarUrl={brief.brand?.avatarUrl}
                partyCaption={text.city(brief.city)}
                badge={<StatusBadge status={brief.status} />}
                title={brief.title}
                chips={text.chips(brief)}
                amount={text.budget(brief) ?? t('list.noBudget')}
                amountCaption={caption(brief)}
                action={actionsFor(brief)}
              />
            ))}
          </SimpleGrid>
          <Center flexDirection="column" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {t('list.count', { shown: briefs.length, total })}
            </Text>
            {query.hasNextPage && (
              <Button variant="outline" onClick={() => query.fetchNextPage()} isLoading={query.isFetchingNextPage}>
                {t('list.more')}
              </Button>
            )}
          </Center>
        </>
      )}

      <AlertDialog isOpen={!!cancelling} leastDestructiveRef={cancelRef} onClose={() => setCancelling(null)}>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>{t('list.cancelDialog.title')}</AlertDialogHeader>
            <AlertDialogBody>{t('list.cancelDialog.body', { title: cancelling?.title })}</AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} variant="ghost" onClick={() => setCancelling(null)}>
                {t('list.cancelDialog.keep')}
              </Button>
              <Button
                colorScheme="red"
                onClick={() => cancelling && cancel.mutate(cancelling.id)}
                isLoading={cancel.isPending}
              >
                {t('list.cancelDialog.confirm')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Stack>
  );
};
