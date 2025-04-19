import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Heading,
  Select,
  Input,
  HStack,
  Text,
} from '@chakra-ui/react';
import { CampaignStats } from '../../types/statistics';

interface StatsTableProps {
  title: string;
  data: CampaignStats[];
  onFilterChange: (filters: {
    date?: string;
    influencer?: string;
    category?: string;
  }) => void;
}

export const StatsTable: React.FC<StatsTableProps> = ({
  title,
  data,
  onFilterChange,
}) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ date: e.target.value });
  };

  const handleInfluencerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ influencer: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ category: e.target.value });
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <Heading size="md" mb={4}>{title}</Heading>
      
      <HStack spacing={4} mb={4}>
        <Box>
          <Text mb={1}>Date</Text>
          <Input type="date" onChange={handleDateChange} />
        </Box>
        <Box>
          <Text mb={1}>Influencer</Text>
          <Select placeholder="All influencers" onChange={handleInfluencerChange}>
            {Array.from(new Set(data.map(item => item.influencerId))).map(id => (
              <option key={id} value={id}>
                {data.find(item => item.influencerId === id)?.influencerName}
              </option>
            ))}
          </Select>
        </Box>
        <Box>
          <Text mb={1}>Category</Text>
          <Select placeholder="All categories" onChange={handleCategoryChange}>
            {Array.from(new Set(data.map(item => item.category))).map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Box>
      </HStack>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Campaign</Th>
            <Th>Influencer</Th>
            <Th isNumeric>Clicks</Th>
            <Th isNumeric>Impressions</Th>
            <Th isNumeric>Engagement Rate</Th>
            <Th isNumeric>Follower Growth</Th>
            <Th>Category</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item) => (
            <Tr key={item.id}>
              <Td>{item.name}</Td>
              <Td>{item.influencerName}</Td>
              <Td isNumeric>{item.clicks.toLocaleString()}</Td>
              <Td isNumeric>{item.impressions.toLocaleString()}</Td>
              <Td isNumeric>{item.engagementRate.toFixed(1)}%</Td>
              <Td isNumeric>{item.followerGrowth.toLocaleString()}</Td>
              <Td>{item.category}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}; 