import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  useToast,
  Image,
  Input,
  Select,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { usersService, User } from '../../services/users';

export const InfluencerList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const toast = useToast();

  const { data: influencers, isLoading, error } = useQuery({
    queryKey: ['influencers', searchQuery, categoryFilter],
    queryFn: async () => {
      if (searchQuery) {
        return usersService.searchInfluencers(searchQuery);
      }
      if (categoryFilter) {
        return usersService.getInfluencersByCategory(categoryFilter);
      }
      return usersService.getAllInfluencers();
    },
  });

  if (isLoading) {
    return <Box p={4}>Loading influencers...</Box>;
  }

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load influencers',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return <Text>Error loading influencers</Text>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Influencers</Heading>
        
        <HStack spacing={4}>
          <Input
            placeholder="Search influencers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            placeholder="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="fashion">Fashion</option>
            <option value="beauty">Beauty</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="tech">Technology</option>
            <option value="food">Food</option>
          </Select>
        </HStack>

        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {influencers?.map((influencer: User) => (
            <Box
              key={influencer.id}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              p={4}
            >
              <HStack spacing={4}>
                <Image
                  src={influencer.avatarUrl || 'https://via.placeholder.com/100'}
                  alt={influencer.name}
                  borderRadius="full"
                  boxSize="100px"
                  objectFit="cover"
                />
                <VStack align="start" spacing={2}>
                  <Heading size="md">{influencer.name}</Heading>
                  <Text>{influencer.bio}</Text>
                  <HStack>
                    {influencer.categories?.map((category: string) => (
                      <Badge key={category} colorScheme="blue">
                        {category}
                      </Badge>
                    ))}
                  </HStack>
                  <Text>Followers: {influencer.followers?.toLocaleString()}</Text>
                  <Text>
                    Engagement Rate: {(influencer.engagementRate || 0).toFixed(2)}%
                  </Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </Grid>
      </VStack>
    </Container>
  );
};

export default InfluencerList; 