import React from 'react';
import { Badge, BadgeProps } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

// Single source of truth for status → color mapping across orders,
// applications, matches and collaborations (docs/DESIGN_SYSTEM.md).
const STATUS_COLOR_SCHEMES: Record<string, string> = {
  open: 'green',
  accepted: 'green',
  active: 'green',
  completed: 'green',
  pending: 'yellow',
  in_progress: 'blue',
  rejected: 'red',
  cancelled: 'red',
  withdrawn: 'gray',
  closed: 'gray',
  expired: 'gray',
};

interface StatusBadgeProps extends BadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const { t } = useTranslation();
  const key = status?.toLowerCase();
  return (
    <Badge colorScheme={STATUS_COLOR_SCHEMES[key] ?? 'gray'} {...props}>
      {key ? t(`status.${key}`, { defaultValue: status }) : t('state.unknown')}
    </Badge>
  );
};
