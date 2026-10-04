import React from 'react';
import { StackProps } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Language, LANGUAGES } from '../i18n';
import { SegmentedControl } from './ui/SegmentedControl';

// RU / KZ / EN. The choice is stored in localStorage.
export const LanguageSwitcher: React.FC<Omit<StackProps, 'onChange'>> = (props) => {
  const { t, i18n } = useTranslation();
  return (
    <SegmentedControl<Language>
      label={t('language.label')}
      size="sm"
      value={(i18n.resolvedLanguage as Language) ?? 'ru'}
      onChange={(lng) => i18n.changeLanguage(lng)}
      segments={LANGUAGES.map((lng) => ({
        value: lng,
        lang: lng,
        label: t(`language.short.${lng}`),
        ariaLabel: t(`language.${lng}`),
      }))}
      {...props}
    />
  );
};

export default LanguageSwitcher;
