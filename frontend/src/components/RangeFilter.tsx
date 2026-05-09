import React from 'react';
import {
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Text,
} from '@chakra-ui/react';

interface RangeFilterProps {
  title: string;
  min: number;
  max: number;
  onChange: (value: number | number[]) => void;
}

export const RangeFilter: React.FC<RangeFilterProps> = ({ title, min, max, onChange }) => {
  // Simple slider for now
  return (
    <Box mb={4}>
      <Text fontWeight="bold" mb={2}>{title}</Text>
      <Slider
        aria-label={`slider-${title.toLowerCase().replace(' ', '-')}`}
        defaultValue={(min + max) / 2}
        min={min}
        max={max}
        onChangeEnd={onChange} // Call onChange when user finishes sliding
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
        {/* Optional: Add marks */}
        <SliderMark value={min} mt='1' ml='-2.5' fontSize='sm'>
          {min}
        </SliderMark>
        <SliderMark value={max} mt='1' ml='-2.5' fontSize='sm'>
          {max}
        </SliderMark>
      </Slider>
    </Box>
  );
};

export default RangeFilter; 