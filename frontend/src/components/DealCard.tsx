import React from 'react';
import { Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { DEAL_TONE, Deal } from '../services/deals';
import { formatDate, formatMoney } from '../i18n';
import { BriefCard, StatusPill } from './ui';

interface DealCardProps {
  deal: Deal;
  /** The viewer's side; the card shows the other one. */
  viewer: 'brand' | 'influencer';
}

/** A deal in a list: the other side, the brief, the agreed price. */
export const DealCard: React.FC<DealCardProps> = ({ deal, viewer }) => {
  const { t } = useTranslation('deals');
  const other = viewer === 'brand' ? deal.creator : deal.brand;
  return (
    <BriefCard
      partyName={other.name}
      partyAvatarUrl={other.avatarUrl}
      partyCaption={other.location}
      badge={<StatusPill tone={DEAL_TONE[deal.status]}>{t(`status.${deal.status}`)}</StatusPill>}
      title={deal.order.title}
      chips={deal.order.category ? [deal.order.category] : []}
      amount={formatMoney(deal.agreedPrice)}
      amountCaption={deal.postBy ? t('card.postBy', { date: formatDate(deal.postBy) }) : t('card.noDate')}
      action={
        <Button
          as={RouterLink}
          to={`/${viewer}/deals/${deal.id}`}
          colorScheme="brand"
          aria-label={t('card.openLabel', { title: deal.order.title })}
        >
          {t('card.open')}
        </Button>
      }
    />
  );
};
