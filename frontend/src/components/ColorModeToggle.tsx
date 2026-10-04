import React from 'react';
import { IconButton, IconButtonProps, useColorMode } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiMoon, FiSun } from 'react-icons/fi';
import { IconWrapper } from './IconWrapper';

export const ColorModeToggle: React.FC<Partial<IconButtonProps>> = (props) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { t } = useTranslation();
  const dark = colorMode === 'dark';
  return (
    <IconButton
      aria-label={dark ? t('theme.switchToLight') : t('theme.switchToDark')}
      title={dark ? t('theme.light') : t('theme.dark')}
      icon={<IconWrapper icon={dark ? FiSun : FiMoon} size="1.1em" />}
      variant="ghost"
      colorScheme="gray"
      borderRadius="full"
      onClick={toggleColorMode}
      {...props}
    />
  );
};

export default ColorModeToggle;
