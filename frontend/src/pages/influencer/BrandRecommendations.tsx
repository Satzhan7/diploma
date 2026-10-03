import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Badge,
  Button,
  HStack,
  useToast,
  Avatar,
  Flex,
  Tooltip,
  Divider,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService } from '../../services/matching';
import { Link as RouterLink } from 'react-router-dom';
import { StarIcon } from '@chakra-ui/icons';
import { FiSearch } from 'react-icons/fi';
import { IconWrapper } from '../../components/IconWrapper';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../i18n/errors';

const BrandRecommendations: React.FC = () => {
  const { t } = useTranslation('influencer');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  // Get brand recommendations
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['matchRecommendations', 'brands', searchQuery, categoryFilter],
    queryFn: () => matchingService.getRecommendations('brands'),
  });

  // Mutation for creating a match
  const createMatchMutation = useMutation({
    mutationFn: (brandId: string) => matchingService.expressInterest(brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMatches'] });
      toast({
        title: t('recommendations.toast.interestTitle'),
        description: t('recommendations.toast.interestDescription'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSelectedBrand(null);
    },
    onError: (error) => {
      toast({
        title: t('common:state.error'),
        description: getErrorMessage(error, t('recommendations.toast.interestError')),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Handle "Express Interest" button click
  const handleExpressInterest = (brandId: string) => {
    setSelectedBrand(brandId);
    createMatchMutation.mutate(brandId);
  };

  // Generate star rating based on overall compatibility score
  const renderStarRating = (score: number) => {
    const starCount = Math.min(Math.round(score / 20), 5); // Convert to 0-5 rating
    return (
      <HStack spacing={1}>
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} color={i < starCount ? 'yellow.400' : 'gray.300'} />
        ))}
      </HStack>
    );
  };

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">{t('recommendations.loadError', { message: getErrorMessage(error) })}</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Stack spacing={6}>
        <Heading size="lg">{t('recommendations.title')}</Heading>
        
        <HStack spacing={4}>
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <IconWrapper icon={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder={t('shared.searchBrands')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          
          <Select
            placeholder={t('recommendations.filterByCategory')}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            maxW="200px"
          >
            <option value="fashion">{t('categories.fashion')}</option>
            <option value="beauty">{t('categories.beauty')}</option>
            <option value="technology">{t('categories.technology')}</option>
            <option value="food">{t('categories.foodBeverage')}</option>
            <option value="lifestyle">{t('categories.lifestyle')}</option>
          </Select>
        </HStack>

        {isLoading ? (
          <Flex justify="center" align="center" minH="200px">
            <Text>{t('recommendations.loading')}</Text>
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {recommendations?.map((brand) => (
              <Card
                key={brand.user.id}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                boxShadow="sm"
                _hover={{ boxShadow: 'md' }}
                height="100%"
              >
                <CardBody>
                  <Stack spacing={4}>
                    <Flex align="center" justify="space-between">
                      <HStack>
                        <Avatar size="md" name={brand.user.name} />
                        <Box>
                          <Heading size="md">{brand.user.name}</Heading>
                          <HStack mt={1}>
                            {renderStarRating(brand.matchScore)}
                            <Text fontSize="sm" fontWeight="bold" color="gray.500">
                              {Math.round(brand.matchScore)}%
                            </Text>
                          </HStack>
                        </Box>
                      </HStack>
                    </Flex>

                    <Text noOfLines={2}>{brand.user.bio || t('recommendations.noDescription')}</Text>

                    {brand.user.categories && brand.user.categories.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          {t('recommendations.categories')}
                        </Text>
                        <HStack flexWrap="wrap" spacing={2}>
                          {brand.user.categories.slice(0, 3).map((category) => (
                            <Badge key={category} colorScheme="purple" borderRadius="full" px={2}>
                              {category}
                            </Badge>
                          ))}
                          {brand.user.categories.length > 3 && (
                            <Tooltip label={brand.user.categories.slice(3).join(', ')}>
                              <Badge colorScheme="gray" borderRadius="full" px={2}>
                                +{brand.user.categories.length - 3}
                              </Badge>
                            </Tooltip>
                          )}
                        </HStack>
                      </Box>
                    )}

                    <Divider />

                    <HStack justifyContent="space-between">
                      <Button
                        as={RouterLink}
                        to={`/influencer/profile/${brand.user.id}`}
                        colorScheme="purple"
                        variant="ghost"
                        size="sm"
                      >
                        {t('recommendations.viewProfile')}
                      </Button>
                      <Button
                        colorScheme="purple"
                        size="sm"
                        isLoading={selectedBrand === brand.user.id && createMatchMutation.isPending}
                        isDisabled={createMatchMutation.isPending}
                        onClick={() => handleExpressInterest(brand.user.id)}
                      >
                        {t('recommendations.expressInterest')}
                      </Button>
                    </HStack>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
};

export default BrandRecommendations;
