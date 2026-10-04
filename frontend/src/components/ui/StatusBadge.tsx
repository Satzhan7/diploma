import React from 'react';
import { BoxProps } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { PillTone, StatusPill } from './StatusPill';

// Single status → tone mapping for orders, applications and deals.
const STATUS_TONES: Record<string, PillTone> = {
  open: 'success',
  accepted: 'success',
  active: 'success',
  completed: 'success',
  pending: 'warn',
  in_progress: 'verified',
  review: 'verified',
  draft: 'neutral',
  paused: 'neutral',
  rejected: 'danger',
  cancelled: 'neutral',
  withdrawn: 'neutral',
  closed: 'neutral',
  expired: 'neutral',
};

interface StatusBadgeProps extends BoxProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const { t } = useTranslation();
  // The API sends `in-progress`; keys use `in_progress`.
  const key = status?.toLowerCase().replace(/-/g, '_');
  return (
    <StatusPill tone={STATUS_TONES[key] ?? 'neutral'} {...props}>
      {key ? t(`status.${key}`, { defaultValue: status }) : t('state.unknown')}
    </StatusPill>
  );
};
