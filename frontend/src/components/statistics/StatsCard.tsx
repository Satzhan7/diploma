import React from 'react';
import { Box, Stat, StatLabel, StatNumber, StatHelpText, StatArrow } from '@chakra-ui/react';

interface StatsCardProps {
  label: string;
  value: number;
  change?: number;
  prefix?: string;
  suffix?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  change,
  prefix = '',
  suffix = '',
}) => {
  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <Stat>
        <StatLabel fontSize="lg">{label}</StatLabel>
        <StatNumber fontSize="3xl">
          {prefix}
          {value.toLocaleString()}
          {suffix}
        </StatNumber>
        {change !== undefined && (
          <StatHelpText>
            <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
            {Math.abs(change).toLocaleString()}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
}; 