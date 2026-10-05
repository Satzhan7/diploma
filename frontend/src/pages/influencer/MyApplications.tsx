import React, { useRef, useState } from 'react';
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
import { FiSend } from 'react-icons/fi';
import { applicationsService, MyApplication } from '../../services/applications';
import { nextSkip } from '../../services/page';
import { formatDate, formatMoney } from '../../i18n';
import { getErrorMessage } from '../../i18n/errors';
import { useBriefText } from '../../components/useBriefText';
import { BriefCard, CardGridSkeleton, EmptyState, PageHeader, StatusBadge } from '../../components/ui';

const PAGE_SIZE = 20;

export const MyApplications: React.FC = () => {
  const text = useBriefText();
  const { t } = text;
  const toast = useToast();
  const queryClient = useQueryClient();
  const [withdrawing, setWithdrawing] = useState<MyApplication | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const query = useInfiniteQuery({
    queryKey: ['applications', 'mine'],
    queryFn: ({ pageParam }) => applicationsService.mine({ take: PAGE_SIZE, skip: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
  });
  const applications = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  const withdraw = useMutation({
    mutationFn: (id: string) => applicationsService.withdraw(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['briefs', 'feed'] });
      toast({ status: 'info', title: t('mine.toasts.withdrawn') });
    },
    onError: (error) => toast({ status: 'error', title: getErrorMessage(error) }),
    onSettled: () => setWithdrawing(null),
  });

  const actionsFor = (a: MyApplication) => (
    <HStack spacing={2} wrap="wrap" justify="flex-end">
      {a.status === 'pending' && (
        <Button variant="ghost" size="sm" onClick={() => setWithdrawing(a)}>
          {t('mine.withdraw')}
        </Button>
      )}
      {a.status === 'accepted' ? (
        <Button as={RouterLink} to="/influencer/deals" colorScheme="brand" size="sm">
          {t('mine.openDeals')}
        </Button>
      ) : (
        <Button as={RouterLink} to={`/influencer/briefs/${a.order.id}`} variant="outline" size="sm">
          {t('mine.viewBrief')}
        </Button>
      )}
    </HStack>
  );

  return (
    <Stack spacing={6}>
      <PageHeader title={t('mine.title')} subtitle={t('mine.subtitle')} />

      {query.isPending ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={getErrorMessage(query.error)}
          action={<Button onClick={() => query.refetch()}>{t('common:actions.retry')}</Button>}
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FiSend}
          title={t('mine.empty.title')}
          description={t('mine.empty.description')}
          action={
            <Button as={RouterLink} to="/influencer/briefs" colorScheme="brand">
              {t('mine.empty.action')}
            </Button>
          }
        />
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {applications.map((a) => (
              <BriefCard
                key={a.id}
                partyName={a.order.brand?.name ?? ''}
                partyAvatarUrl={a.order.brand?.avatarUrl}
                partyCaption={t('mine.appliedOn', { date: formatDate(a.createdAt) })}
                badge={<StatusBadge status={a.status} />}
                title={a.order.title}
                chips={text.chips(a.order)}
                amount={a.proposedPrice != null ? formatMoney(a.proposedPrice) : (text.budget(a.order) ?? '—')}
                amountCaption={t(a.proposedPrice != null ? 'mine.yourPrice' : 'mine.briefBudget')}
                action={actionsFor(a)}
              />
            ))}
          </SimpleGrid>
          <Center flexDirection="column" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {t('list.count', { shown: applications.length, total })}
            </Text>
            {query.hasNextPage && (
              <Button variant="outline" onClick={() => query.fetchNextPage()} isLoading={query.isFetchingNextPage}>
                {t('list.more')}
              </Button>
            )}
          </Center>
        </>
      )}

      <AlertDialog isOpen={!!withdrawing} leastDestructiveRef={cancelRef} onClose={() => setWithdrawing(null)}>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>{t('mine.withdrawDialog.title')}</AlertDialogHeader>
            <AlertDialogBody>{t('mine.withdrawDialog.body', { title: withdrawing?.order.title })}</AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} variant="ghost" onClick={() => setWithdrawing(null)}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                colorScheme="red"
                onClick={() => withdrawing && withdraw.mutate(withdrawing.id)}
                isLoading={withdraw.isPending}
              >
                {t('mine.withdrawDialog.confirm')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Stack>
  );
};
