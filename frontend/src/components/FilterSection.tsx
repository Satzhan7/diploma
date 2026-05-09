import React from 'react';
import { Box, CheckboxGroup, Checkbox, Stack, Text } from '@chakra-ui/react';

interface FilterSectionProps {
  title: string;
  options: string[];
  onSelect: (selectedOptions: string[]) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ title, options, onSelect }) => {
  return (
    <Box mb={4}>
      <Text fontWeight="bold" mb={2}>{title}</Text>
      <CheckboxGroup onChange={onSelect}>
        <Stack>
          {options.map((option) => (
            <Checkbox key={option} value={option}>
              {option}
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
    </Box>
  );
};

export default FilterSection; 