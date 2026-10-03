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
  Input,
  Select,
  Card,
  CardBody,
  Avatar,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { usersService, User } from '../../services/users';
import { formatNumber } from '../../i18n';

export const InfluencerList: React.FC = () => {
  const { t } = useTranslation('brand');
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
    return <Box p={4}>{t('influencerList.loading')}</Box>;
  }

  if (error) {
    toast({
      title: t('common:state.error'),
      description: t('influencerList.loadError'),
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return <Text>{t('influencerList.loadError')}</Text>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">{t('influencerList.title')}</Heading>
        
        <HStack spacing={4}>
          <Input
            placeholder={t('influencerList.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            placeholder={t('influencerList.categoryPlaceholder')}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="fashion">{t('categories.fashion')}</option>
            <option value="beauty">{t('categories.beauty')}</option>
            <option value="lifestyle">{t('categories.lifestyle')}</option>
            <option value="tech">{t('categories.tech')}</option>
            <option value="food">{t('categories.food')}</option>
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
                          <Badge key={cat} colorScheme="brand" variant="subtle">
                            {t(`categories.${cat.toLowerCase()}`, { defaultValue: cat })}
                          </Badge>
                        ))}
                      </HStack>
                    )}
                    <Text fontSize="sm" color="gray.500">
                      {t('influencerList.followers', {
                        followers:
                          influencer.profile?.followers != null
                            ? formatNumber(influencer.profile.followers)
                            : t('notAvailable'),
                      })}
                    </Text>
                    <Text fontSize="sm" noOfLines={3} textAlign="center">
                      {influencer.profile?.bio || t('influencerList.noBio')}
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