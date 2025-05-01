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
  Card,
  CardBody,
  Avatar,
  SimpleGrid,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { usersService, User } from '../../services/users';
import { useAuth } from '../../contexts/AuthContext';

export const InfluencerList: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
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

  const basePath = location.pathname.startsWith('/brand') ? '/brand' : 
                   location.pathname.startsWith('/influencer') ? '/influencer' : '';

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
            <ChakraLink 
              key={influencer.id} 
              as={RouterLink} 
              to={`${basePath}/profile/${influencer.id}`} 
              _hover={{ textDecoration: 'none' }}
            >
              <Card 
                _hover={{ 
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
                transition="all 0.2s ease-in-out"
                cursor="pointer"
                height="100%"
              >
                <CardBody>
                  <VStack spacing={4} align="center">
                    <Avatar size="xl" name={influencer.name} src={influencer.profile?.avatarUrl} />
                    <Heading size="md" textAlign="center">{influencer.name}</Heading>
                    {influencer.profile?.categories && influencer.profile.categories.length > 0 && (
                      <HStack wrap="wrap" justify="center" spacing={2}>
                        {influencer.profile.categories.slice(0, 5).map((cat) => (
                          <Badge key={cat} colorScheme="blue" variant="subtle">
                            {cat}
                          </Badge>
                        ))}
                      </HStack>
                    )}
                    <Text fontSize="sm" color="gray.500">
                      Followers: {influencer.profile?.followers?.toLocaleString() || 'N/A'}
                    </Text>
                    <Text fontSize="sm" noOfLines={3} textAlign="center">
                      {influencer.profile?.bio || 'No bio available.'}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </ChakraLink>
          ))}
        </Grid>
      </VStack>
    </Container>
  );
};

export default InfluencerList; 