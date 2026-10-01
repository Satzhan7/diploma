import React from 'react';
import { Badge, BadgeProps } from '@chakra-ui/react';

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

const formatStatusLabel = (status: string) =>
  status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

interface StatusBadgeProps extends BadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => (
  <Badge colorScheme={STATUS_COLOR_SCHEMES[status?.toLowerCase()] ?? 'gray'} {...props}>
    {formatStatusLabel(status ?? 'Unknown')}
  </Badge>
);
