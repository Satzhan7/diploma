import React from 'react';
import { Box, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Flex } from '@chakra-ui/react';

interface StatCardProps {
  title: string;
  value: string | number;
  helpText?: string;
  change?: number;
  isIncrease?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  helpText,
  change,
  isIncrease,
  icon,
}) => {
  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      _hover={{ shadow: 'lg' }}
      transition="all 0.3s"
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel fontWeight="medium" isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold">
            {value}
          </StatNumber>
          {(helpText || change !== undefined) && (
            <StatHelpText mb={0}>
              {change !== undefined && (
                <>
                  <StatArrow type={isIncrease ? 'increase' : 'decrease'} />
                  {change}%
                </>
              )}
              {helpText && (change !== undefined ? ' ' : '') + helpText}
            </StatHelpText>
          )}
        </Stat>
        {icon && <Box ml={2}>{icon}</Box>}
      </Flex>
    </Box>
  );
}; 