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
import { useTranslation } from 'react-i18next';

const BrandList: React.FC = () => {
  const { t } = useTranslation('influencer');
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
    return <Text>{t('common:state.loading')}</Text>;
  }

  if (error) {
    toast({
      title: t('common:state.error'),
      description: t('brandList.loadErrorDescription'),
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return <Text>{t('brandList.loadError')}</Text>;
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading size="lg">{t('brandList.title')}</Heading>
        
        <HStack spacing={4}>
          <Input
            placeholder={t('shared.searchBrands')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            placeholder={t('brandList.filterByIndustry')}
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="fashion">{t('categories.fashion')}</option>
            <option value="beauty">{t('categories.beauty')}</option>
            <option value="lifestyle">{t('categories.lifestyle')}</option>
            <option value="tech">{t('categories.technology')}</option>
            <option value="food">{t('categories.food')}</option>
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
                  src={brand.profile?.avatarUrl || 'https://via.placeholder.com/100'}
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
                      <Badge colorScheme="brand">
                        {brand.industry}
                      </Badge>
                    )}
                  </HStack>
                  <Text>{t('brandList.location', { location: brand.location })}</Text>
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