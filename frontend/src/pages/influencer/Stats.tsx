import React, { useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useToast,
  VisuallyHidden,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiImage, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import { filesService, IMAGE_ACCEPT, MAX_IMAGE_BYTES, MAX_PORTFOLIO_IMAGES, publicFileUrl } from '../../services/files';
import { MyVerification, verificationService, VerificationStatus } from '../../services/verification';
import { formatDate, formatNumber, formatPercent } from '../../i18n';
import { getErrorMessage, getFieldErrors } from '../../i18n/errors';
import { PageHeader, PillTone, StatusPill } from '../../components/ui';

const STATUS_TONE: Record<VerificationStatus, PillTone> = {
  none: 'neutral',
  pending: 'warn',
  approved: 'verified',
  rejected: 'danger',
};

const IMAGE_TYPES = IMAGE_ACCEPT.split(',');

/** Client-side check before upload; the server checks the bytes again. */
const imageProblem = (file: File): 'tooLarge' | 'wrongType' | null =>
  !IMAGE_TYPES.includes(file.type) ? 'wrongType' : file.size > MAX_IMAGE_BYTES ? 'tooLarge' : null;

/** `/influencer/stats`: the stats claim for the Verified badge and the portfolio. */
export const Stats: React.FC = () => {
  const { t } = useTranslation('stats');
  return (
    <Stack spacing={8} maxW="880px">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <VerificationCard />
      <PortfolioCard />
    </Stack>
  );
};

const VerificationCard: React.FC = () => {
  const { t } = useTranslation('stats');
  const toast = useToast();
  const queryClient = useQueryClient();
  const mine = useQuery({ queryKey: ['verification', 'me'], queryFn: verificationService.mine });

  const [followers, setFollowers] = useState('');
  const [rate, setRate] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // A verified creator opens the form on purpose: a new claim drops the badge.
  const [reopened, setReopened] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const submit = useMutation({
    mutationFn: verificationService.submit,
    onSuccess: (result) => {
      queryClient.setQueryData(['verification', 'me'], result);
      setFollowers('');
      setRate('');
      setScreenshot(null);
      setErrors({});
      setReopened(false);
      toast({ status: 'success', title: t('toasts.submitted') });
    },
    onError: (error) => {
      const found = getFieldErrors(error);
      setErrors(found);
      if (!Object.keys(found).length) toast({ status: 'error', title: getErrorMessage(error) });
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const followersNumber = Number(followers);
    const rateNumber = Number(rate.replace(',', '.'));
    if (!followers.trim() || !Number.isInteger(followersNumber) || followersNumber < 1) {
      next.followers = t(followers.trim() ? 'errors:validation.isInt' : 'errors:validation.isNotEmpty');
    }
    if (!rate.trim() || !Number.isFinite(rateNumber) || rateNumber < 0 || rateNumber > 100) {
      next.engagementRate = t(rate.trim() ? 'errors:validation.isNumber' : 'errors:validation.isNotEmpty');
    }
    if (!screenshot) next.file = t('form.required');
    else if (imageProblem(screenshot)) next.file = t(`form.${imageProblem(screenshot)}`);
    setErrors(next);
    if (Object.keys(next).length || !screenshot) return;
    submit.mutate({ followers: followersNumber, engagementRate: rateNumber, screenshot });
  };

  const data = mine.data;
  const status = data?.status ?? 'none';

  return (
    <Stack as="section" aria-labelledby="verification-title" layerStyle="card" p={{ base: 4, md: 6 }} spacing={5}>
      <HStack justify="space-between" align="flex-start" wrap="wrap" gap={2}>
        <Heading id="verification-title" as="h2" fontSize="xl">
          {t('verification.title')}
        </Heading>
        {mine.isPending ? (
          <Skeleton h="22px" w="90px" borderRadius="full" />
        ) : (
          <StatusPill tone={STATUS_TONE[status]}>{t(`verification.status.${status}`)}</StatusPill>
        )}
      </HStack>

      {mine.isError ? <Text color="danger">{getErrorMessage(mine.error)}</Text> : data && <StatusText data={data} />}

      {status === 'approved' && !reopened && (
        <Box>
          <Button variant="outline" onClick={() => setReopened(true)}>
            {t('form.newClaim')}
          </Button>
        </Box>
      )}

      {(status === 'none' || status === 'rejected' || reopened) && !mine.isPending && (
        <Stack as="form" noValidate onSubmit={onSubmit} spacing={4} aria-labelledby="verification-title">
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
            <FormControl isRequired isInvalid={!!errors.followers}>
              <FormLabel>{t('form.followers')}</FormLabel>
              <Input
                inputMode="numeric"
                value={followers}
                onChange={(e) => setFollowers(e.target.value.replace(/\D/g, ''))}
              />
              <FormErrorMessage>{errors.followers}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.engagementRate}>
              <FormLabel>{t('form.engagementRate')}</FormLabel>
              <Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
              <FormErrorMessage>{errors.engagementRate}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>

          <FormControl isRequired isInvalid={!!errors.file}>
            <FormLabel htmlFor="verification-file">{t('form.screenshot')}</FormLabel>
            <HStack spacing={3} wrap="wrap">
              <Button leftIcon={<FiUpload aria-hidden />} variant="outline" onClick={() => fileInput.current?.click()}>
                {t(screenshot ? 'form.change' : 'form.choose')}
              </Button>
              {screenshot && (
                <Text fontSize="sm" color="fg.muted" noOfLines={1} maxW="full">
                  {screenshot.name}
                </Text>
              )}
            </HStack>
            <VisuallyHidden>
              <input
                id="verification-file"
                ref={fileInput}
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={(e) => {
                  setScreenshot(e.target.files?.[0] ?? null);
                  setErrors(({ file: _file, ...rest }) => rest);
                  e.target.value = '';
                }}
              />
            </VisuallyHidden>
            <FormHelperText>{t('form.screenshotHint')}</FormHelperText>
            <FormErrorMessage>{errors.file}</FormErrorMessage>
          </FormControl>

          {status === 'approved' && (
            <Text fontSize="sm" color="fg.muted">
              {t('form.resubmitNote')}
            </Text>
          )}
          <Box>
            <Button type="submit" colorScheme="brand" isLoading={submit.isPending}>
              {t('form.submit')}
            </Button>
          </Box>
        </Stack>
      )}
    </Stack>
  );
};

const StatusText: React.FC<{ data: MyVerification }> = ({ data }) => {
  const { t } = useTranslation('stats');
  const claimed =
    data.followers != null && data.engagementRate != null
      ? t('verification.claimed', {
          followers: formatNumber(data.followers),
          rate: formatPercent(data.engagementRate / 100),
        })
      : null;

  switch (data.status) {
    case 'pending':
      return (
        <Stack spacing={1}>
          <Text>{t('verification.pendingBody', { date: formatDate(data.submittedAt!) })}</Text>
          {claimed && <Text color="fg.muted">{claimed}</Text>}
        </Stack>
      );
    case 'approved':
      return (
        <Stack spacing={1}>
          <Text>{t('verification.approvedBody')}</Text>
          {claimed && <Text color="fg.muted">{claimed}</Text>}
        </Stack>
      );
    case 'rejected':
      return (
        <Alert status="error" borderRadius="md" alignItems="flex-start">
          <AlertIcon />
          <AlertDescription>
            <Text fontWeight="600">{t('verification.rejectedReason', { reason: data.rejectReason })}</Text>
            <Text>{t('verification.rejectedBody')}</Text>
          </AlertDescription>
        </Alert>
      );
    default:
      return <Text color="fg.muted">{t('verification.noneBody')}</Text>;
  }
};

const PortfolioCard: React.FC = () => {
  const { t } = useTranslation('stats');
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const portfolio = useQuery({ queryKey: ['portfolio', 'me'], queryFn: filesService.myPortfolio });
  const images = portfolio.data ?? [];
  const isFull = images.length >= MAX_PORTFOLIO_IMAGES;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['portfolio', 'me'] });
  const add = useMutation({
    mutationFn: filesService.addPortfolio,
    onSuccess: () => {
      refresh();
      toast({ status: 'success', title: t('toasts.added'), duration: 2000 });
    },
    onError: (error) => toast({ status: 'error', title: getErrorMessage(error) }),
  });
  const remove = useMutation({
    mutationFn: filesService.removePortfolio,
    onSuccess: () => {
      refresh();
      toast({ status: 'success', title: t('toasts.removed'), duration: 2000 });
    },
    onError: (error) => toast({ status: 'error', title: getErrorMessage(error) }),
  });

  const onPick = (file: File | undefined) => {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      toast({ status: 'error', title: t(`form.${problem}`) });
      return;
    }
    add.mutate(file);
  };

  return (
    <Stack as="section" aria-labelledby="portfolio-title" layerStyle="card" p={{ base: 4, md: 6 }} spacing={5}>
      <HStack justify="space-between" align="flex-start" wrap="wrap" gap={2}>
        <Box>
          <Heading id="portfolio-title" as="h2" fontSize="xl">
            {t('portfolio.title')}
          </Heading>
          <Text color="fg.muted" mt={1}>
            {t('portfolio.subtitle')}
          </Text>
        </Box>
        <Text fontSize="sm" color="fg.muted" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {t('portfolio.count', { n: images.length })}
        </Text>
      </HStack>

      {portfolio.isPending ? (
        <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={3}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} aspectRatio={4 / 5} borderRadius="md" />
          ))}
        </SimpleGrid>
      ) : portfolio.isError ? (
        <Text color="danger">{getErrorMessage(portfolio.error)}</Text>
      ) : (
        <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={3} as="ul" listStyleType="none">
          {images.map((image, i) => (
            <Box as="li" key={image.id} position="relative" aspectRatio={4 / 5} borderRadius="md" overflow="hidden">
              <Image
                src={publicFileUrl(image.id)}
                alt={t('portfolio.alt', { n: i + 1 })}
                objectFit="cover"
                w="full"
                h="full"
                bg="bg.subtle"
              />
              <IconButton
                aria-label={t('portfolio.remove', { n: i + 1 })}
                icon={<FiTrash2 />}
                size="sm"
                position="absolute"
                top={2}
                right={2}
                bg="chrome.bg"
                isLoading={remove.isPending && remove.variables === image.id}
                onClick={() => remove.mutate(image.id)}
              />
            </Box>
          ))}
          {!isFull && (
            <Box as="li" aspectRatio={4 / 5}>
              <Button
                w="full"
                h="full"
                variant="outline"
                borderStyle="dashed"
                borderRadius="md"
                flexDirection="column"
                gap={2}
                whiteSpace="normal"
                isLoading={add.isPending}
                onClick={() => fileInput.current?.click()}
              >
                <FiPlus aria-hidden />
                {t('portfolio.add')}
              </Button>
            </Box>
          )}
        </SimpleGrid>
      )}
      {!portfolio.isPending && images.length === 0 && (
        <HStack color="fg.muted" fontSize="sm">
          <FiImage aria-hidden />
          <Text>{t('portfolio.empty')}</Text>
        </HStack>
      )}
      <VisuallyHidden>
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_ACCEPT}
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            onPick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </VisuallyHidden>
    </Stack>
  );
};
