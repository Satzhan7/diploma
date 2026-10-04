import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatusPill } from './StatusPill';

/** "Verified": an admin has checked this creator's stats. */
export const VerifiedBadge: React.FC = () => {
  const { t } = useTranslation();
  return <StatusPill tone="verified">{t('badge.verified')}</StatusPill>;
};
