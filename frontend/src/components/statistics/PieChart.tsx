import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Heading, useColorModeValue } from '@chakra-ui/react';
import { CampaignStats } from '../../types/statistics';

interface PieChartProps {
  title?: string;
  data: CampaignStats[];
  dataKey: keyof CampaignStats;
  nameKey: keyof CampaignStats;
  colors?: string[];
  suffix?: string;
  prefix?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  dataKey,
  nameKey,
  colors = COLORS,
  suffix = '',
  prefix = ''
}) => {
  const tooltipBg = useColorModeValue('white', 'gray.800');

  // Формат для тултипа
  const formatValue = (value: number) => {
    return `${prefix}${value.toLocaleString()}${suffix}`;
  };

  // Генерируем уникальный ID для каждого графика
  const chartId = React.useId();

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      {title && <Heading size="md" mb={4}>{title}</Heading>}
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
                <Cell key={`cell-${chartId}-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatValue(value)} 
              contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: 'none' }}
            />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}; 