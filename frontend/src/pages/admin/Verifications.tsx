import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiShield } from 'react-icons/fi';
import { adminService, AdminVerification, ClaimStatus } from '../../services/admin';
import { nextSkip } from '../../services/page';
import { formatDate, formatNumber, formatPercent } from '../../i18n';
import { getErrorMessage, getFieldErrors } from '../../i18n/errors';
import { PrivateImage } from '../../components/PrivateImage';
import {
  CardGridSkeleton,
  EmptyState,
  PageHeader,
  PillTone,
  SegmentedControl,
  StatusPill,
  PageContainer,
} from '../../components/ui';
import { layout } from '../../theme';

const PAGE_SIZE = 10;

const TONE: Record<ClaimStatus, PillTone> = { pending: 'warn', approved: 'verified', rejected: 'danger' };

const number = (value: number | null) => (value != null ? formatNumber(value) : '—');
const percent = (value: number | null) => (value != null ? formatPercent(value / 100) : '—');

/** `/admin/verifications`: each stats claim beside its screenshot. */
export const Verifications: React.FC = () => {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ClaimStatus>('pending');
  const [rejecting, setRejecting] = useState<AdminVerification | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['admin', 'verifications', status],
    queryFn: ({ pageParam }) => adminService.verifications({ status, take: PAGE_SIZE, skip: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
  const approve = useMutation({
    mutationFn: adminService.approve,
    onSuccess: (v) => {
      refresh();
      toast({ status: 'success', title: t('verifications.toasts.approved', { name: v.creator.name }) });
    },
    onError: (error) => {
      refresh();
      toast({ status: 'error', title: getErrorMessage(error) });
    },
  });

  return (
    <PageContainer>
      <PageHeader title={t('verifications.title')} subtitle={t('verifications.subtitle')} />
      <SegmentedControl<ClaimStatus>
        label={t('verifications.title')}
        value={status}
        onChange={setStatus}
        segments={(['pending', 'approved', 'rejected'] as const).map((value) => ({
          value,
          label: t(`verifications.filter.${value}`),
        }))}
      />

      {query.isPending ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={getErrorMessage(query.error)}
          action={<Button onClick={() => query.refetch()}>{t('common:actions.retry')}</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={FiShield} title={t('verifications.empty')} />
      ) : (
        <>
          <Stack spacing={4}>
            {items.map((v) => (
              <SimpleGrid
                key={v.id}
                as="article"
                aria-labelledby={`claim-${v.id}`}
                layerStyle="card"
                columns={{ base: 1, md: 2 }}
                spacing={layout.grid}
                p={layout.card}
              >
                {v.screenshotId ? (
                  <PrivateImage
                    fileId={v.screenshotId}
                    alt={t('verifications.screenshot', { name: v.creator.name })}
                    errorText={t('verifications.screenshotError')}
                    h={{ base: 80, md: 96 }}
                  />
                ) : (
                  <Center bg="bg.subtle" borderRadius="md" minH={52} color="fg.muted">
                    {t('verifications.screenshotError')}
                  </Center>
                )}
                <Stack spacing={4} minW={0}>
                  <HStack justify="space-between" align="flex-start" gap={2}>
                    <Box minW={0}>
                      <Heading id={`claim-${v.id}`} as="h2" textStyle="h3" noOfLines={1}>
                        {v.creator.name}
                      </Heading>
                      <Text fontSize="sm" color="fg.muted" noOfLines={1}>
                        {v.creator.email}
                      </Text>
                    </Box>
                    <StatusPill tone={TONE[v.status]}>{t(`verifications.filter.${v.status}`)}</StatusPill>
                  </HStack>

                  <Box as="table" w="full" fontSize="sm" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    <Box as="thead">
                      <Box as="tr" color="fg.muted" textAlign="left">
                        <Box as="th" fontWeight="500" pb={1} />
                        <Box as="th" fontWeight="500" pb={1}>
                          {t('verifications.claimed')}
                        </Box>
                        <Box as="th" fontWeight="500" pb={1}>
                          {t('verifications.onProfile')}
                        </Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      <Box as="tr">
                        <Box as="th" scope="row" textAlign="left" fontWeight="500" color="fg.muted" py={1}>
                          {t('verifications.followers')}
                        </Box>
                        <Box as="td" fontWeight="700">
                          {number(v.followers)}
                        </Box>
                        <Box as="td">{number(v.creator.followersCount)}</Box>
                      </Box>
                      <Box as="tr">
                        <Box as="th" scope="row" textAlign="left" fontWeight="500" color="fg.muted" py={1}>
                          {t('verifications.engagement')}
                        </Box>
                        <Box as="td" fontWeight="700">
                          {percent(v.engagementRate)}
                        </Box>
                        <Box as="td">{percent(v.creator.engagementRate)}</Box>
                      </Box>
                    </Box>
                  </Box>

                  <Text fontSize="sm" color="fg.muted">
                    {t('verifications.submitted', {
                      date: formatDate(v.submittedAt, { dateStyle: 'medium', timeStyle: 'short' }),
                    })}
                    {v.reviewedAt && ` · ${t('verifications.reviewed', { date: formatDate(v.reviewedAt) })}`}
                  </Text>
                  {v.rejectReason && (
                    <Text fontSize="sm" color="danger" overflowWrap="anywhere">
                      {t('verifications.rejectedWith', { reason: v.rejectReason })}
                    </Text>
                  )}

                  {v.status === 'pending' && (
                    <HStack spacing={2} wrap="wrap" mt="auto">
                      <Button
                        colorScheme="brand"
                        onClick={() => approve.mutate(v)}
                        isLoading={approve.isPending && approve.variables?.id === v.id}
                      >
                        {t('verifications.approve')}
                      </Button>
                      <Button variant="outline" onClick={() => setRejecting(v)}>
                        {t('verifications.reject')}
                      </Button>
                    </HStack>
                  )}
                </Stack>
              </SimpleGrid>
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

      <RejectDialog
        claim={rejecting}
        onClose={() => setRejecting(null)}
        onDone={() => {
          setRejecting(null);
          refresh();
        }}
      />
    </PageContainer>
  );
};

const RejectDialog: React.FC<{
  claim: AdminVerification | null;
  onClose: () => void;
  onDone: () => void;
}> = ({ claim, onClose, onDone }) => {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  const reject = useMutation({
    mutationFn: (v: AdminVerification) => adminService.reject(v, reason.trim()),
    onSuccess: () => {
      toast({ status: 'success', title: t('verifications.toasts.rejected') });
      setReason('');
      onDone();
    },
    onError: (err) => {
      const fields = getFieldErrors(err);
      if (fields.reason) setError(fields.reason);
      else {
        toast({ status: 'error', title: getErrorMessage(err) });
        onDone();
      }
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const length = reason.trim().length;
    if (length < 3 || length > 500) {
      setError(t(length ? 'errors:validation.minLength' : 'errors:validation.isNotEmpty'));
      return;
    }
    if (claim) reject.mutate(claim);
  };

  return (
    <Modal
      isOpen={!!claim}
      onClose={() => {
        setError(null);
        onClose();
      }}
      initialFocusRef={field}
      isCentered
    >
      <ModalOverlay />
      <ModalContent as="form" noValidate onSubmit={submit} mx={4}>
        <ModalHeader>{t('verifications.rejectTitle')}</ModalHeader>
        <ModalBody>
          <FormControl isRequired isInvalid={!!error}>
            <FormLabel>{t('verifications.reason')}</FormLabel>
            <Textarea
              ref={field}
              value={reason}
              maxLength={500}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
            />
            <FormHelperText>{t('verifications.reasonHint')}</FormHelperText>
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            {t('verifications.cancel')}
          </Button>
          <Button type="submit" colorScheme="red" isLoading={reject.isPending}>
            {t('verifications.reject')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
