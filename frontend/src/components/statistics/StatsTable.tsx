import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  TableContainer,
  Text,
} from '@chakra-ui/react';

// Export the interface so it can be imported elsewhere
export interface StatItem {
  id: string;
  name: string;
  clicks?: number;
  impressions?: number;
  engagementRate?: number;
  followerGrowth?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  influencerId?: string;
  influencerName?: string;
  brandId?: string;
  brandName?: string;
  category?: string;
  status?: string; // Optional status
}

interface StatsTableProps {
  data: StatItem[];
  title?: string;
  headers: string[];
  renderRow: (item: StatItem) => React.ReactNode;
}

export const StatsTable: React.FC<StatsTableProps> = ({ data, title, headers, renderRow }) => {
  return (
    <Box>
      {title && <Text fontSize="xl" fontWeight="semibold" mb={4}>{title}</Text>}
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              {headers.map((header) => (
                <Th key={header}>{header}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map(renderRow)}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StatsTable; 