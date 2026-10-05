import { useTranslation } from 'react-i18next';
import { formatMoney } from '../i18n';
import { BriefCity, BriefFields, budgetLabel, timeLeft } from '../services/briefs';

/** Translated pieces of a brief, shared by the brand and creator pages. */
export function useBriefText() {
  const { t } = useTranslation('briefs');
  const category = (value: string) => t(`brand:categories.${value.toLowerCase()}`, { defaultValue: value });
  return {
    t,
    category,
    city: (value: BriefCity | null) => (value ? t(`city.${value}`) : null),
    budget: (brief: Pick<BriefFields, 'budgetMin' | 'budgetMax'>) => budgetLabel(brief, formatMoney),
    /** Platform, formats and category, as card chips. */
    chips: (brief: Pick<BriefFields, 'platform' | 'formats' | 'category'>) =>
      [
        brief.platform ? t(`platform.${brief.platform}`) : null,
        ...brief.formats.map((format) => t(`format.${format}`)),
        brief.category ? category(brief.category) : null,
      ].filter((chip): chip is string => !!chip),
    /** "3 days left" / "17 h left"; `hot` under 48 hours. */
    timeLeft: (postBy: string) => {
      const left = timeLeft(postBy);
      return {
        hot: left.hot,
        label: left.days >= 2 ? t('feed.daysLeft', { count: left.days }) : t('feed.hoursLeft', { count: left.hours }),
      };
    },
  };
}
