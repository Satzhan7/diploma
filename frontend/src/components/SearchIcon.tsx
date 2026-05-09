import React from 'react';
import { Icon, IconProps } from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';

export const SearchIcon: React.FC<IconProps> = (props) => (
  <Icon as={FiSearch as React.ElementType} {...props} />
); 