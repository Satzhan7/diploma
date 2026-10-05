import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  Link,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { briefsService } from '../../services/briefs';
import { applicationsService } from '../../services/applications';
import { formatDate, formatMoney } from '../../i18n';
import { getErrorMessage, getFieldErrors } from '../../i18n/errors';
import { useBriefText } from '../../components/useBriefText';
import { EmptyState, StatusBadge } from '../../components/ui';
import i18n from '../../i18n';

const required = () => i18n.t('validation.isNotEmpty', { ns: 'errors' });

export const Apply: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const text = useBriefText();
  const { t } = text;
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const brief = useQuery({ queryKey: ['brief', id], queryFn: () => briefsService.get(id) });

  const send = useMutation({
    mutationFn: () =>
      applicationsService.apply(id, {
        message: message.trim(),
        ...(price ? { proposedPrice: Math.round(Number(price)) } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brief', id] });
      queryClient.invalidateQueries({ queryKey: ['briefs', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => {
      const found = getFieldErrors(error);
      setErrors(Object.keys(found).length ? found : { form: getErrorMessage(error) });
    },
  });

  const back = (
    <Link
      as={RouterLink}
      to="/influencer/briefs"
      fontSize="sm"
      color="fg.muted"
      display="inline-flex"
      gap={1}
      alignItems="center"
    >
      <FiArrowLeft aria-hidden /> {t('apply.back')}
    </Link>
  );

  if (brief.isPending) return <Text color="fg.muted">{t('common:state.loading')}</Text>;
  if (brief.isError) {
    return (
      <Stack spacing={4}>
        {back}
        <EmptyState title={getErrorMessage(brief.error)} />
      </Stack>
    );
  }

  const b = brief.data;
  const formats = b.formats.map((f) => t(`format.${f}`)).join(', ');
  const facts: [string, string | null][] = [
    [t('apply.facts.budget'), text.budget(b)],
    [t('apply.facts.postBy'), b.postBy ? formatDate(b.postBy) : null],
    [t('apply.facts.content'), [b.platform && t(`platform.${b.platform}`), formats].filter(Boolean).join(' · ')],
    [t('apply.facts.deliverables'), b.deliverables],
    [t('apply.facts.city'), text.city(b.city)],
    [t('apply.facts.languages'), b.languages.map((l) => t(`language.${l}`)).join(', ') || null],
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!message.trim()) found.message = required();
    if (price && !(Number(price) >= 1)) found.proposedPrice = i18n.t('validation.min', { ns: 'errors' });
    setErrors(found);
    if (!Object.keys(found).length) send.mutate();
  };

  const mine = b.myApplication;
  const sent = send.isSuccess || !!mine;

  return (
    <Stack spacing={5} maxW="720px">
      {back}
      <HStack spacing={3}>
        <Avatar
          size="md"
          name={b.brand?.name}
          src={b.brand?.avatarUrl ?? undefined}
          bg="primary.soft"
          color="primary.ink"
        />
        <Box minW={0}>
          <Text fontWeight="700" noOfLines={1}>
            {b.brand?.name}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {[text.city(b.city), b.publishedAt && t('apply.posted', { date: formatDate(b.publishedAt) })]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </Box>
      </HStack>

      <Text as="h1" textStyle="display" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.15" overflowWrap="anywhere">
        {b.title}
      </Text>

      <SimpleGrid as="dl" columns={{ base: 2, md: 3 }} spacing={3}>
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <Box key={label} layerStyle="card" p={3} minW={0}>
              <Text as="dt" fontSize="xs" color="fg.muted">
                {label}
              </Text>
              <Text as="dd" fontWeight="600" overflowWrap="anywhere">
                {value}
              </Text>
            </Box>
          ))}
      </SimpleGrid>

      {b.description && (
        <Text whiteSpace="pre-line" overflowWrap="anywhere">
          {b.description}
        </Text>
      )}
      {b.requirements && (
        <Box>
          <Text fontWeight="600" mb={1}>
            {t('apply.requirements')}
          </Text>
          <Text whiteSpace="pre-line" color="fg.muted" overflowWrap="anywhere">
            {b.requirements}
          </Text>
        </Box>
      )}

      {sent ? (
        <Stack layerStyle="card" p={5} spacing={3} align="flex-start" role="status">
          <HStack spacing={2}>
            <Box as={FiCheckCircle} color="success" aria-hidden />
            <Text fontWeight="700">{t('apply.sentTitle')}</Text>
            {mine && <StatusBadge status={mine.status} />}
          </HStack>
          <Text color="fg.muted">{t('apply.sentBody', { brand: b.brand?.name })}</Text>
          {mine?.proposedPrice != null && (
            <Text fontSize="sm">{t('apply.yourPrice', { price: formatMoney(mine.proposedPrice) })}</Text>
          )}
          <HStack spacing={2} wrap="wrap">
            <Button as={RouterLink} to="/influencer/briefs" colorScheme="brand">
              {t('apply.browse')}
            </Button>
            <Button as={RouterLink} to="/influencer/applications" variant="outline">
              {t('apply.myApplications')}
            </Button>
          </HStack>
        </Stack>
      ) : b.status !== 'open' ? (
        <EmptyState title={t('apply.closed')} />
      ) : (
        <Stack as="form" noValidate onSubmit={submit} layerStyle="card" p={{ base: 4, md: 5 }} spacing={4}>
          <FormControl isInvalid={!!errors.message} isRequired>
            <FormLabel>{t('apply.pitch')}</FormLabel>
            <Textarea
              rows={5}
              maxLength={2000}
              value={message}
              placeholder={t('apply.pitchPlaceholder')}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors(({ message: _, ...rest }) => rest);
              }}
            />
            <FormErrorMessage>{errors.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.proposedPrice}>
            <FormLabel>{t('apply.price')}</FormLabel>
            <InputGroup>
              <InputLeftAddon>₸</InputLeftAddon>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1000}
                value={price}
                placeholder={b.budgetMax != null ? String(b.budgetMax) : undefined}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setErrors(({ proposedPrice: _, ...rest }) => rest);
                }}
              />
            </InputGroup>
            <FormHelperText>{t('apply.priceHint')}</FormHelperText>
            <FormErrorMessage>{errors.proposedPrice}</FormErrorMessage>
          </FormControl>
          {errors.form && (
            <Text role="alert" color="danger" fontSize="sm">
              {errors.form}
            </Text>
          )}
          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={send.isPending}
            alignSelf={{ base: 'stretch', sm: 'flex-start' }}
          >
            {t('apply.send')}
          </Button>
        </Stack>
      )}
    </Stack>
  );
};
