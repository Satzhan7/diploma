import React from 'react';
import { Button, ButtonGroup, ButtonGroupProps } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

// Segmented RU / KZ / EN control. The choice is stored in localStorage.
export const LanguageSwitcher: React.FC<ButtonGroupProps> = (props) => {
  const { t, i18n } = useTranslation();

  return (
    <ButtonGroup size="xs" isAttached variant="outline" role="group" aria-label={t('language.label')} {...props}>
      {LANGUAGES.map((lng) => {
        const isActive = i18n.resolvedLanguage === lng;
        return (
          <Button
            key={lng}
            lang={lng}
            title={t(`language.${lng}`)}
            aria-label={t(`language.${lng}`)}
            aria-pressed={isActive}
            variant={isActive ? 'solid' : 'outline'}
            colorScheme={isActive ? 'brand' : 'gray'}
            onClick={() => i18n.changeLanguage(lng)}
          >
            {t(`language.short.${lng}`)}
          </Button>
        );
      })}
    </ButtonGroup>
  );
};

export default LanguageSwitcher;
