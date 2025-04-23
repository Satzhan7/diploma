import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Image,
  Badge,
  Button,
  HStack,
  VStack,
  Progress,
  useToast,
  Spinner,
  Center,
  Avatar,
  Flex,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService } from '../../services/matching';
import { Link as RouterLink } from 'react-router-dom';
import { StarIcon } from '@chakra-ui/icons';

const MatchRecommendations: React.FC = () => {
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Get influencer recommendations
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['matchRecommendations', 'influencers'],
    queryFn: () => matchingService.getRecommendations('', 'influencers'), // Assuming we fetch all recommendations
  });

  // Mutation for creating a match
  const createMatchMutation = useMutation({
    mutationFn: (influencerId: string) => 
      matchingService.createMatch({
        influencerId,
        name: 'New Collaboration',
        category: 'General',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMatches'] });
      toast({
        title: 'Collaboration request sent',
        description: 'The influencer will be notified of your interest',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSelectedInfluencer(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send collaboration request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Handle "Send Request" button click
  const handleSendRequest = (influencerId: string) => {
    setSelectedInfluencer(influencerId);
    createMatchMutation.mutate(influencerId);
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

  // Render influencer card
  const renderInfluencerCard = (influencerData: any) => {
    const influencer = influencerData.user;
    const isSelected = selectedInfluencer === influencer.id;

    return (
      <Card
        key={influencer.id}
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
                <Avatar 
                  size="md" 
                  name={influencer.name} 
                />
                <Box>
                  <Heading size="md">{influencer.name}</Heading>
                  <HStack mt={1}>
                    {renderStarRating(influencerData.matchScore)}
                    <Text fontSize="sm" fontWeight="bold" color="gray.500">
                      {Math.round(influencerData.matchScore)}%
                    </Text>
                  </HStack>
                </Box>
              </HStack>
            </Flex>

            <Text noOfLines={2}>{influencer.bio || 'No bio available'}</Text>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                Compatibility
              </Text>
              <HStack spacing={4} mb={2}>
                <VStack align="flex-start" flex="1">
                  <Text fontSize="xs" color="gray.500">Category Match</Text>
                  <Progress value={Math.random() * 100} size="sm" width="100%" borderRadius="full" colorScheme="blue" />
                </VStack>
                <VStack align="flex-start" flex="1">
                  <Text fontSize="xs" color="gray.500">Audience Fit</Text>
                  <Progress value={Math.random() * 100} size="sm" width="100%" borderRadius="full" colorScheme="purple" />
                </VStack>
              </HStack>
            </Box>

            {influencer.categories && influencer.categories.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1}>
                  Categories
                </Text>
                <HStack flexWrap="wrap" spacing={2}>
                  {influencer.categories.slice(0, 3).map((category: string) => (
                    <Badge key={category} colorScheme="blue" borderRadius="full" px={2}>
                      {category}
                    </Badge>
                  ))}
                  {influencer.categories.length > 3 && (
                    <Tooltip label={influencer.categories.slice(3).join(', ')}>
                      <Badge colorScheme="gray" borderRadius="full" px={2}>
                        +{influencer.categories.length - 3}
                      </Badge>
                    </Tooltip>
                  )}
                </HStack>
              </Box>
            )}

            <Divider />

            <HStack justifyContent="space-between">
              <Text fontSize="sm">
                {influencer.followers 
                  ? `${new Intl.NumberFormat().format(influencer.followers)} followers` 
                  : ''}
              </Text>
              <Button
                as={RouterLink}
                to={`/influencers/${influencer.id}`}
                colorScheme="blue"
                variant="ghost"
                size="sm"
              >
                View Profile
              </Button>
            </HStack>

            <Button
              colorScheme="blue"
              isLoading={isSelected && createMatchMutation.isPending}
              loadingText="Sending"
              onClick={() => handleSendRequest(influencer.id)}
            >
              Send Collaboration Request
            </Button>
          </Stack>
        </CardBody>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Center py={10}>
        <VStack>
          <Spinner size="xl" />
          <Text mt={4}>Loading recommendations...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={10}>
        <VStack>
          <Text color="red.500">Error loading recommendations.</Text>
          <Button mt={4} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Heading mb={2} size="lg">
        Recommended Influencers
      </Heading>
      <Text mb={6} color="gray.600">
        Discover influencers that match your brand's needs and interests
      </Text>

      {recommendations && recommendations.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {recommendations.map(renderInfluencerCard)}
        </SimpleGrid>
      ) : (
        <Center py={10}>
          <VStack>
            <Text>No recommendations available at this time.</Text>
            <Text fontSize="sm" color="gray.500">
              Please try again later or update your brand profile.
            </Text>
          </VStack>
        </Center>
      )}
    </Box>
  );
};

export default MatchRecommendations; 