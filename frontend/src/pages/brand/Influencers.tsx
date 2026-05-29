import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Input,
  Select,
  Button,
  Stack,
  Heading,
  Text,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface FilterState {
  niches: string[];
  platforms: string[];
  minFollowers: number;
  maxFollowers: number;
  location: string;
}

function Influencers() {
  const toast = useToast();
  const [filters, setFilters] = useState<FilterState>({
    niches: [],
    platforms: [],
    minFollowers: 0,
    maxFollowers: 1000000,
    location: '',
  });

  const { data: influencers, isLoading } = useQuery({
    queryKey: ['influencers', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.niches.length) {
        filters.niches.forEach(niche => params.append('niches', niche));
      }
      if (filters.platforms.length) {
        filters.platforms.forEach(platform => params.append('platforms', platform));
      }
      params.append('minFollowers', filters.minFollowers.toString());
      params.append('maxFollowers', filters.maxFollowers.toString());
      if (filters.location) {
        params.append('location', filters.location);
      }

      const response = await api.get(`/profiles/influencers/search?${params.toString()}`);
      return response.data;
    },
  });

  const handleConnect = async (influencerId: string) => {
    try {
      await api.post('/matching', {
        influencerId,
        message: 'I would like to collaborate with you!',
      });
      
      toast({
        title: 'Connection request sent',
        description: 'The influencer will be notified of your interest.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send connection request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>Find Influencers</Heading>

      {/* Filters */}
      <Stack spacing={4} mb={8}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input
              placeholder="Enter location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Follower Range</FormLabel>
            <RangeSlider
              min={0}
              max={1000000}
              step={1000}
              value={[filters.minFollowers, filters.maxFollowers]}
              onChange={([min, max]) => setFilters({
                ...filters,
                minFollowers: min,
                maxFollowers: max,
              })}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
              <RangeSliderThumb index={1} />
            </RangeSlider>
            <Text fontSize="sm" color="gray.600">
              {filters.minFollowers.toLocaleString()} - {filters.maxFollowers.toLocaleString()} followers
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel>Niche</FormLabel>
            <Select
              placeholder="Select niche"
              onChange={(e) => {
                const value = e.target.value;
                if (value && !filters.niches.includes(value)) {
                  setFilters({
                    ...filters,
                    niches: [...filters.niches, value],
                  });
                }
              }}
            >
              <option value="fashion">Fashion</option>
              <option value="beauty">Beauty</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="travel">Travel</option>
              <option value="food">Food</option>
              <option value="fitness">Fitness</option>
              <option value="technology">Technology</option>
              <option value="gaming">Gaming</option>
            </Select>
          </FormControl>
        </SimpleGrid>
      </Stack>

      {/* Results */}
      {isLoading ? (
        <Text>Loading influencers...</Text>
      ) : influencers?.length ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {influencers.map((influencer: any) => (
            <Box
              key={influencer.id}
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="lg"
            >
              <Stack spacing={4}>
                <Box>
                  <Heading size="md">{influencer.name}</Heading>
                  <Text color="gray.600">{influencer.location}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Followers:</Text>
                  <Text>{influencer.followersCount.toLocaleString()}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Niches:</Text>
                  <Text>{influencer.niches.join(', ')}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Platforms:</Text>
                  <Text>{influencer.platforms.join(', ')}</Text>
                </Box>

                <Button
                  colorScheme="blue"
                  onClick={() => handleConnect(influencer.id)}
                >
                  Connect
                </Button>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Text>No influencers found matching your criteria.</Text>
      )}
    </Box>
  );
}

export default Influencers; 