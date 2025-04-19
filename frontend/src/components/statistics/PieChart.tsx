import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Heading } from '@chakra-ui/react';
import { CampaignStats } from '../../types/statistics';

interface PieChartProps {
  title: string;
  data: CampaignStats[];
  dataKey: keyof CampaignStats;
  nameKey: keyof CampaignStats;
  colors?: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  dataKey,
  nameKey,
  colors = COLORS,
}) => {
  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <Heading size="md" mb={4}>{title}</Heading>
      <Box h="300px">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}; 