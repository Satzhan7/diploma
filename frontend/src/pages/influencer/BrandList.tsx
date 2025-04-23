import React, { useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Image,
  Badge,
  Input,
  Select,
  HStack,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { usersService, User } from '../../services/users';

const BrandList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const toast = useToast();

  const { data: brands, isLoading, error } = useQuery({
    queryKey: ['brands', searchQuery, industryFilter],
    queryFn: async () => {
      if (searchQuery) {
        return usersService.searchBrands(searchQuery);
      }
      if (industryFilter) {
        return usersService.getBrandsByIndustry(industryFilter);
      }
      return usersService.getAllBrands();
    },
  });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load brands',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return <Text>Error loading brands</Text>;
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading size="lg">Brands</Heading>
        
        <HStack spacing={4}>
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            placeholder="Filter by industry"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="fashion">Fashion</option>
            <option value="beauty">Beauty</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="tech">Technology</option>
            <option value="food">Food</option>
          </Select>
        </HStack>

        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {brands?.map((brand: User) => (
            <Box
              key={brand.id}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              p={4}
            >
              <HStack spacing={4}>
                <Image
                  src={brand.avatarUrl || 'https://via.placeholder.com/100'}
                  alt={brand.name}
                  borderRadius="full"
                  boxSize="100px"
                  objectFit="cover"
                />
                <VStack align="start" spacing={2}>
                  <Heading size="md">{brand.name}</Heading>
                  <Text>{brand.bio}</Text>
                  <HStack>
                    {brand.industry && (
                      <Badge colorScheme="purple">
                        {brand.industry}
                      </Badge>
                    )}
                  </HStack>
                  <Text>Location: {brand.location}</Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </Grid>
      </VStack>
    </Box>
  );
};

export default BrandList; 