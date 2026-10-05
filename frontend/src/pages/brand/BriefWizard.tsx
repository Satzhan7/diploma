import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Brief,
  BriefFields,
  briefProblems,
  briefsService,
  CATEGORIES,
  CITIES,
  FORMATS,
  GOALS,
  LANGUAGES,
  PLATFORMS,
  todayInKazakhstan,
} from '../../services/briefs';
import { getErrorCode, getErrorMessage, getFieldErrors } from '../../i18n/errors';
import { formatDate } from '../../i18n';
import i18n from '../../i18n';
import { useBriefText } from '../../components/useBriefText';
import { BriefCard, EmptyState, PageHeader } from '../../components/ui';

const STEPS = ['goal', 'content', 'budget', 'creators', 'review'] as const;

/** The step that holds each field, to jump to the first one with an error. */
const STEP_OF: Record<string, number> = {
  goal: 0,
  title: 0,
  description: 0,
  platform: 1,
  formats: 1,
  deliverables: 1,
  requirements: 1,
  budgetMin: 2,
  budgetMax: 2,
  postBy: 2,
  city: 2,
  category: 3,
  languages: 3,
};

const EMPTY: BriefFields = {
  title: '',
  description: null,
  goal: null,
  platform: null,
  formats: [],
  city: null,
  languages: [],
  category: null,
  budgetMin: null,
  budgetMax: null,
  deliverables: null,
  requirements: null,
  postBy: null,
};

const fieldsOf = (brief: Brief): BriefFields => {
  const fields = { ...EMPTY };
  for (const key of Object.keys(EMPTY) as (keyof BriefFields)[]) {
    Object.assign(fields, { [key]: brief[key] ?? EMPTY[key] });
  }
  return fields;
};

// Blank text becomes null so a cleared field is cleared on the server too.
const payloadOf = (fields: BriefFields): Partial<BriefFields> => {
  const blank = (value: string | null) => (value?.trim() ? value.trim() : null);
  return {
    ...fields,
    title: fields.title.trim(),
    description: blank(fields.description),
    deliverables: blank(fields.deliverables),
    requirements: blank(fields.requirements),
  };
};

const ruleMessage = (rule: string) =>
  i18n.t(i18n.exists(`validation.${rule}`, { ns: 'errors' }) ? `validation.${rule}` : 'validation.default', {
    ns: 'errors',
  });

interface ChipOption {
  value: string;
  label: string;
}

/** Toggle chips; `multiple` allows several, otherwise a second click clears. */
const ChipGroup: React.FC<{
  label: string;
  options: ChipOption[];
  value: string[];
  multiple?: boolean;
  onChange: (value: string[]) => void;
}> = ({ label, options, value, multiple, onChange }) => {
  const id = useId();
  return (
    <>
      <FormLabel id={id} as="div">
        {label}
      </FormLabel>
      <Flex role="group" aria-labelledby={id} wrap="wrap" gap={2}>
        {options.map((option) => {
          const on = value.includes(option.value);
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              h="40px"
              borderRadius="full"
              variant="outline"
              aria-pressed={on}
              borderColor={on ? 'primary' : 'border.default'}
              bg={on ? 'primary.soft' : 'transparent'}
              color={on ? 'primary.ink' : 'fg.default'}
              fontWeight="500"
              onClick={() =>
                onChange(
                  multiple
                    ? on
                      ? value.filter((v) => v !== option.value)
                      : [...value, option.value]
                    : on
                      ? []
                      : [option.value],
                )
              }
            >
              {option.label}
            </Button>
          );
        })}
      </Flex>
    </>
  );
};

export const BriefWizard: React.FC = () => {
  const { id: routeId } = useParams<{ id: string }>();
  const text = useBriefText();
  const { t } = text;
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [briefId, setBriefId] = useState<string | undefined>(routeId);
  const [fields, setFields] = useState<BriefFields>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existing = useQuery({
    queryKey: ['briefs', 'detail', routeId],
    queryFn: () => briefsService.get(routeId!),
    enabled: !!routeId,
  });
  // Fill the form once: a later refetch must not overwrite what is being typed.
  const filled = useRef(false);
  useEffect(() => {
    if (existing.data && !filled.current) {
      filled.current = true;
      setFields(fieldsOf(existing.data));
    }
  }, [existing.data]);

  const status = existing.data?.status ?? 'draft';
  const isOpen = status === 'open';

  const set = <K extends keyof BriefFields>(key: K, value: BriefFields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
  };

  /** Shows server field errors and moves to the first step that has one. */
  const showErrors = (found: Record<string, string>) => {
    setErrors(found);
    const steps = Object.keys(found).map((field) => STEP_OF[field] ?? 0);
    if (steps.length) setStep(Math.min(...steps));
  };

  const save = async (): Promise<Brief> => {
    const payload = payloadOf(fields);
    const saved = briefId ? await briefsService.update(briefId, payload) : await briefsService.create(payload);
    // The URL stays /new: switching routes would remount the wizard mid-way.
    if (!briefId) setBriefId(saved.id);
    queryClient.invalidateQueries({ queryKey: ['briefs'] });
    queryClient.setQueryData(['briefs', 'detail', saved.id], saved);
    return saved;
  };

  const onError = (error: unknown) => {
    const found = getFieldErrors(error);
    if (Object.keys(found).length) {
      showErrors(found);
      toast({ status: 'error', title: t('wizard.fixFields') });
    } else {
      toast({ status: 'error', title: getErrorMessage(error) });
    }
  };

  const saveDraft = useMutation({
    mutationFn: save,
    onSuccess: () => toast({ status: 'success', title: t('wizard.toasts.saved') }),
    onError,
  });

  const publish = useMutation({
    mutationFn: async () => {
      const saved = await save();
      return isOpen ? saved : briefsService.publish(saved.id);
    },
    onSuccess: (brief) => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      toast({ status: 'success', title: t(isOpen ? 'wizard.toasts.updated' : 'wizard.toasts.published') });
      navigate(isOpen ? '/brand/briefs' : `/brand/briefs/${brief.id}/applicants`);
    },
    onError,
  });

  const onSaveDraft = () => {
    if (fields.title.trim().length < 3) {
      showErrors({ title: ruleMessage(fields.title.trim() ? 'minLength' : 'isNotEmpty') });
      return;
    }
    saveDraft.mutate();
  };

  // Next checks the fields of this step only; Review checks them all.
  const stepProblems = (index: number) =>
    Object.fromEntries(
      Object.entries(briefProblems(fields)).filter(([field]) => index === STEPS.length - 1 || STEP_OF[field] === index),
    );
  const onNext = () => {
    const found = stepProblems(step);
    if (Object.keys(found).length) {
      showErrors(Object.fromEntries(Object.entries(found).map(([f, rule]) => [f, ruleMessage(rule)])));
      return;
    }
    setStep((s) => s + 1);
  };
  const onPublish = () => {
    const found = stepProblems(STEPS.length - 1);
    if (Object.keys(found).length) {
      showErrors(Object.fromEntries(Object.entries(found).map(([f, rule]) => [f, ruleMessage(rule)])));
      toast({ status: 'error', title: t('wizard.fixFields') });
      return;
    }
    publish.mutate();
  };

  if (routeId && existing.isPending) {
    return <Text color="fg.muted">{t('common:state.loading')}</Text>;
  }
  if (routeId && existing.isError) {
    return (
      <EmptyState
        title={getErrorCode(existing.error) ? getErrorMessage(existing.error) : t('wizard.loadError')}
        action={
          <Button as={RouterLink} to="/brand/briefs">
            {t('wizard.backToBriefs')}
          </Button>
        }
      />
    );
  }
  if (routeId && status !== 'draft' && !isOpen) {
    return (
      <EmptyState
        title={t('wizard.notEditable')}
        action={
          <Button as={RouterLink} to="/brand/briefs">
            {t('wizard.backToBriefs')}
          </Button>
        }
      />
    );
  }

  const opts = (values: readonly string[], prefix: string): ChipOption[] =>
    values.map((value) => ({ value, label: t(`${prefix}.${value}`) }));
  const err = (field: keyof BriefFields) => errors[field];
  const isLast = step === STEPS.length - 1;
  const busy = saveDraft.isPending || publish.isPending;
  const none = t('wizard.review.none');

  const reviewRows: [string, string][] = [
    [t('wizard.fields.title'), fields.title || none],
    [t('wizard.fields.goal'), fields.goal ? t(`goal.${fields.goal}`) : none],
    [t('wizard.review.content'), text.chips({ ...fields, category: null }).join(', ') || none],
    [t('wizard.fields.deliverables'), fields.deliverables || none],
    [t('wizard.review.budget'), text.budget(fields) ?? none],
    [t('wizard.fields.postBy'), fields.postBy ? formatDate(fields.postBy) : none],
    [t('wizard.fields.city'), text.city(fields.city) ?? none],
    [
      t('wizard.review.creators'),
      [fields.category && text.category(fields.category), ...fields.languages.map((l) => t(`language.${l}`))]
        .filter(Boolean)
        .join(', ') || t('wizard.review.anyCreator'),
    ],
  ];

  return (
    <Stack spacing={6}>
      <PageHeader
        title={t(routeId ? 'wizard.titleEdit' : 'wizard.titleNew')}
        subtitle={t(`wizard.steps.${STEPS[step]}.hint`)}
      />

      <Box overflowX="auto" mx={-1} px={1}>
        <HStack spacing={2} as="nav" aria-label={t('wizard.stepsLabel')}>
          {STEPS.map((key, index) => (
            <Button
              key={key}
              size="sm"
              h="40px"
              borderRadius="full"
              variant="ghost"
              flex="none"
              bg={index === step ? 'primary.soft' : 'transparent'}
              color={index <= step ? 'fg.default' : 'fg.muted'}
              aria-current={index === step ? 'step' : undefined}
              onClick={() => setStep(index)}
              leftIcon={
                <Box
                  as="span"
                  w="22px"
                  h="22px"
                  borderRadius="full"
                  display="grid"
                  placeItems="center"
                  fontSize="xs"
                  bg={index <= step ? 'primary' : 'bg.subtle'}
                  color={index <= step ? 'primary.fg' : 'fg.muted'}
                >
                  {index < step ? '✓' : index + 1}
                </Box>
              }
            >
              {t(`wizard.steps.${key}.label`)}
            </Button>
          ))}
        </HStack>
      </Box>

      <Flex gap={5} align="flex-start" wrap="wrap">
        <Stack
          as="form"
          noValidate
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            if (isLast) onPublish();
            else onNext();
          }}
          layerStyle="card"
          p={{ base: 4, md: 6 }}
          spacing={5}
          flex="3 1 380px"
          minW={0}
        >
          <Box>
            <Text fontWeight="700" fontSize="lg">
              {t(`wizard.steps.${STEPS[step]}.title`)}
            </Text>
          </Box>

          {step === 0 && (
            <>
              <FormControl isInvalid={!!err('goal')}>
                <ChipGroup
                  label={t('wizard.fields.goal')}
                  options={opts(GOALS, 'goal')}
                  value={fields.goal ? [fields.goal] : []}
                  onChange={([v]) => set('goal', (v as BriefFields['goal']) ?? null)}
                />
                <FormErrorMessage>{err('goal')}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!err('title')} isRequired>
                <FormLabel>{t('wizard.fields.title')}</FormLabel>
                <Input
                  value={fields.title}
                  maxLength={120}
                  placeholder={t('wizard.placeholders.title')}
                  onChange={(e) => set('title', e.target.value)}
                />
                <FormErrorMessage>{err('title')}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!err('description')}>
                <FormLabel>{t('wizard.fields.description')}</FormLabel>
                <Textarea
                  rows={4}
                  maxLength={2000}
                  value={fields.description ?? ''}
                  placeholder={t('wizard.placeholders.description')}
                  onChange={(e) => set('description', e.target.value)}
                />
                <FormErrorMessage>{err('description')}</FormErrorMessage>
              </FormControl>
            </>
          )}

          {step === 1 && (
            <>
              <FormControl isInvalid={!!err('platform')}>
                <ChipGroup
                  label={t('wizard.fields.platform')}
                  options={opts(PLATFORMS, 'platform')}
                  value={fields.platform ? [fields.platform] : []}
                  onChange={([v]) => set('platform', (v as BriefFields['platform']) ?? null)}
                />
                <FormErrorMessage>{err('platform')}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!err('formats')}>
                <ChipGroup
                  multiple
                  label={t('wizard.fields.formats')}
                  options={opts(FORMATS, 'format')}
                  value={fields.formats}
                  onChange={(v) => set('formats', v as BriefFields['formats'])}
                />
                <FormErrorMessage>{err('formats')}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!err('deliverables')}>
                <FormLabel>{t('wizard.fields.deliverables')}</FormLabel>
                <Input
                  maxLength={500}
                  value={fields.deliverables ?? ''}
                  placeholder={t('wizard.placeholders.deliverables')}
                  onChange={(e) => set('deliverables', e.target.value)}
                />
                <FormErrorMessage>{err('deliverables')}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!err('requirements')}>
                <FormLabel>{t('wizard.fields.requirements')}</FormLabel>
                <Textarea
                  rows={3}
                  maxLength={2000}
                  value={fields.requirements ?? ''}
                  placeholder={t('wizard.placeholders.requirements')}
                  onChange={(e) => set('requirements', e.target.value)}
                />
                <FormHelperText>{t('wizard.optional')}</FormHelperText>
                <FormErrorMessage>{err('requirements')}</FormErrorMessage>
              </FormControl>
            </>
          )}

          {step === 2 && (
            <>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                {(['budgetMin', 'budgetMax'] as const).map((key) => (
                  <FormControl key={key} isInvalid={!!err(key)}>
                    <FormLabel>{t(`wizard.fields.${key}`)}</FormLabel>
                    <InputGroup>
                      <InputLeftAddon>₸</InputLeftAddon>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1000}
                        value={fields[key] ?? ''}
                        onChange={(e) => set(key, e.target.value === '' ? null : Math.round(Number(e.target.value)))}
                      />
                    </InputGroup>
                    <FormErrorMessage>{err(key)}</FormErrorMessage>
                  </FormControl>
                ))}
              </SimpleGrid>
              <Text fontSize="sm" color="fg.muted" mt={-2}>
                {t('wizard.budgetHint')}
              </Text>
              <FormControl isInvalid={!!err('postBy')}>
                <FormLabel>{t('wizard.fields.postBy')}</FormLabel>
                <Input
                  type="date"
                  min={todayInKazakhstan(Date.now() + 86_400_000)}
                  value={fields.postBy ?? ''}
                  onChange={(e) => set('postBy', e.target.value || null)}
                />
                <FormErrorMessage>{err('postBy')}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!err('city')}>
                <ChipGroup
                  label={t('wizard.fields.city')}
                  options={opts(CITIES, 'city')}
                  value={fields.city ? [fields.city] : []}
                  onChange={([v]) => set('city', (v as BriefFields['city']) ?? null)}
                />
                <FormErrorMessage>{err('city')}</FormErrorMessage>
              </FormControl>
            </>
          )}

          {step === 3 && (
            <>
              <FormControl isInvalid={!!err('category')}>
                <ChipGroup
                  label={t('wizard.fields.category')}
                  options={CATEGORIES.map((value) => ({ value, label: text.category(value) }))}
                  value={fields.category ? [fields.category] : []}
                  onChange={([v]) => set('category', v ?? null)}
                />
                <FormHelperText>{t('wizard.rankHint')}</FormHelperText>
                <FormErrorMessage>{err('category')}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!err('languages')}>
                <ChipGroup
                  multiple
                  label={t('wizard.fields.languages')}
                  options={opts(LANGUAGES, 'language')}
                  value={fields.languages}
                  onChange={(v) => set('languages', v as BriefFields['languages'])}
                />
                <FormErrorMessage>{err('languages')}</FormErrorMessage>
              </FormControl>
            </>
          )}

          {step === 4 && (
            <Box as="dl" borderWidth="1px" borderColor="border.default" borderRadius="md">
              {reviewRows.map(([label, value], index) => (
                <Flex
                  key={label}
                  justify="space-between"
                  gap={3}
                  px={4}
                  py={3}
                  borderTopWidth={index ? '1px' : 0}
                  borderColor="border.default"
                  fontSize="sm"
                >
                  <Text as="dt" color="fg.muted">
                    {label}
                  </Text>
                  <Text as="dd" fontWeight="600" textAlign="right" overflowWrap="anywhere">
                    {value}
                  </Text>
                </Flex>
              ))}
            </Box>
          )}

          {Object.keys(errors).length > 0 && (
            <Text role="alert" fontSize="sm" color="danger">
              {t('wizard.fixFields')}
            </Text>
          )}

          <Flex gap={2} justify="space-between" wrap="wrap" borderTopWidth="1px" borderColor="border.default" pt={4}>
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} isDisabled={step === 0}>
              {t('wizard.back')}
            </Button>
            <HStack spacing={2}>
              {!isOpen && (
                <Button variant="ghost" onClick={onSaveDraft} isLoading={saveDraft.isPending} isDisabled={busy}>
                  {t('wizard.saveDraft')}
                </Button>
              )}
              <Button type="submit" colorScheme="brand" isLoading={publish.isPending} isDisabled={busy}>
                {isLast ? t(isOpen ? 'wizard.saveChanges' : 'wizard.publish') : t('wizard.next')}
              </Button>
            </HStack>
          </Flex>
        </Stack>

        <Stack flex="2 1 280px" minW={0} spacing={2} position={{ lg: 'sticky' }} top={{ lg: 4 }}>
          <Text fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wider" color="fg.muted">
            {t('wizard.preview')}
          </Text>
          <BriefCard
            partyName={existing.data?.brand?.name ?? user?.profile?.companyName ?? user?.name ?? ''}
            partyAvatarUrl={existing.data?.brand?.avatarUrl}
            partyCaption={[text.city(fields.city), fields.category && text.category(fields.category)]
              .filter(Boolean)
              .join(' · ')}
            title={fields.title.trim() || t('wizard.placeholders.previewTitle')}
            chips={text.chips(fields)}
            amount={text.budget(fields) ?? '—'}
            amountCaption={fields.postBy ? t('list.postBy', { date: formatDate(fields.postBy) }) : t('list.noDate')}
          />
        </Stack>
      </Flex>
    </Stack>
  );
};
