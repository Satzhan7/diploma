import React from 'react';
import {
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';

interface StatCardProps {
  title: string;
  stat: string | number;
  helpText?: string;
  change?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, stat, helpText, change }) => {
  return (
    <Card>
      <CardBody>
        <Stat>
          <StatLabel>{title}</StatLabel>
          <StatNumber>{stat}</StatNumber>
          {(helpText || change !== undefined) && (
            <StatHelpText>
              {change !== undefined && (
                <StatArrow type={change > 0 ? 'increase' : 'decrease'} />
              )}
              {helpText || `${Math.abs(change!)}%`}
            </StatHelpText>
          )}
        </Stat>
      </CardBody>
    </Card>
  );
}; 