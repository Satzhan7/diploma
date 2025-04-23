import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Heading, useColorModeValue } from '@chakra-ui/react';
import { DailyStats } from '../../types/statistics';

interface LineChartProps {
  title?: string;
  data: DailyStats[];
  dataKey: keyof DailyStats;
  color?: string;
  xAxisDataKey?: string;
  suffix?: string;
  prefix?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  dataKey,
  color = '#3182CE',
  xAxisDataKey = 'date',
  suffix = '',
  prefix = ''
}) => {
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const gridColor = useColorModeValue('gray.200', 'gray.700');

  // Формат для отображения значений на тултипе
  const formatValue = (value: number) => {
    return `${prefix}${value.toLocaleString()}${suffix}`;
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      {title && <Heading size="md" mb={4}>{title}</Heading>}
      <Box h="300px">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey={xAxisDataKey} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // Если это дата, форматируем её
                if (xAxisDataKey === 'date' && typeof value === 'string') {
                  const date = new Date(value);
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                }
                return value;
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `${value / 1000}k`;
                }
                return value;
              }}
            />
            <Tooltip 
              formatter={(value: number) => formatValue(value)}
              contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: 'none' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}; 