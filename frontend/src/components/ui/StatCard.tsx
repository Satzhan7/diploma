import React from 'react';
import {
  Card,
  CardBody,
  Flex,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { IconWrapper } from '../IconWrapper';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: IconType;
  helpText?: string;
}

// KPI card for dashboards: icon chip + label + large tabular number.
export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, helpText }) => (
  <Card>
    <CardBody p={5}>
      <Flex align="center" gap={4}>
        {icon && (
          <Box
            bg="bg.subtle"
            color="accent.solid"
            borderRadius="lg"
            p={3}
            display="inline-flex"
            flexShrink={0}
          >
            <IconWrapper icon={icon} size="1.25em" />
          </Box>
        )}
        <Stat>
          <StatLabel color="fg.muted" fontSize="sm" fontWeight="500">
            {label}
          </StatLabel>
          <StatNumber fontSize="2xl" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </StatNumber>
          {helpText && <StatHelpText mb={0}>{helpText}</StatHelpText>}
        </Stat>
      </Flex>
    </CardBody>
  </Card>
);
