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
import { Box, Heading } from '@chakra-ui/react';
import { DailyStats } from '../../types/statistics';

interface LineChartProps {
  title: string;
  data: DailyStats[];
  dataKey: keyof DailyStats;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  dataKey,
  color = '#3182CE',
}) => {
  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <Heading size="md" mb={4}>{title}</Heading>
      <Box h="300px">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              activeDot={{ r: 8 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}; 