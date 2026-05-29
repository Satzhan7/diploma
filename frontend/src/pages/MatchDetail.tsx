import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  VStack,
  HStack,
  Badge,
  Button,
  Divider,
  useToast,
  Link as ChakraLink,
  Avatar,
  SimpleGrid,
  Card,
  CardBody,
  useDisclosure,
} from '@chakra-ui/react';
import { matchingService, Match } from '../services/matching';
import { IconWrapper } from '../components/IconWrapper';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UpdateStatsModal } from '../components/UpdateStatsModal';

export const MatchDetail: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen: isStatsModalOpen, onOpen: onStatsModalOpen, onClose: onStatsModalClose } = useDisclosure();

  const { data: match, isLoading, error } = useQuery<Match, Error>({
    queryKey: ['match', matchId],
    queryFn: () => matchingService.getMatchById(matchId!),
    enabled: !!matchId,
  });

  if (isLoading) {
    return <Center p={10}><Spinner /></Center>;
  }

  if (error) {
    toast({
      title: 'Error loading match details',
      description: error.message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return <Center p={10}><Text color="red.500">Could not load match details.</Text></Center>;
  }

  if (!match) {
    return <Center p={10}><Text>Match not found.</Text></Center>;
  }

  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'accepted': return 'green';
      case 'completed': return 'blue';
      case 'rejected': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const brand = match.brand;
  const influencer = match.influencer;

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Match Details</Heading>
          <Button
            leftIcon={<IconWrapper icon={FiArrowLeft} />}
            onClick={() => navigate(-1)} // Go back
            variant="outline"
            size="sm"
          >
            Back
          </Button>
        </HStack>

        <Card variant="outline">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Match ID: {match.id.substring(0, 8)}...</Text>
                <Badge colorScheme={getStatusColor(match.status)}>
                  {match.status}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Created: {new Date(match.createdAt).toLocaleDateString()}
              </Text>
              
              <Divider my={2} />
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Brand Details */}
                <Box>
                  <Heading size="sm" mb={2}>Brand</Heading>
                  {brand ? (
                    <HStack>
                      <Avatar size="sm" name={brand.name} src={brand.profile?.avatarUrl} />
                      <ChakraLink as={RouterLink} to={`/${user?.role}/profile/${brand.id}`} color="blue.500">
                        {brand.name}
                      </ChakraLink>
                    </HStack>
                  ) : (
                    <Text>Brand info not available.</Text>
                  )}
                </Box>
                
                {/* Influencer Details */}
                <Box>
                  <Heading size="sm" mb={2}>Influencer</Heading>
                  {influencer ? (
                    <HStack>
                      <Avatar size="sm" name={influencer.name} src={influencer.profile?.avatarUrl} />
                      <ChakraLink as={RouterLink} to={`/${user?.role}/profile/${influencer.id}`} color="blue.500">
                         {influencer.name}
                      </ChakraLink>
                    </HStack>
                  ) : (
                    <Text>Influencer info not available.</Text>
                  )}
                </Box>
              </SimpleGrid>

              {/* Add more details as needed, e.g., stats */}
              {match.stats && (
                <>
                  <Divider my={2} />
                  <Heading size="sm" mb={2}>Match Stats (Example)</Heading>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Box textAlign="center">
                      <Text fontWeight="bold">Clicks</Text>
                      <Text>{match.stats.clicks ?? 'N/A'}</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontWeight="bold">Impressions</Text>
                      <Text>{match.stats.impressions ?? 'N/A'}</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontWeight="bold">Engagement</Text>
                      <Text>{match.stats.engagementRate ? `${match.stats.engagementRate}%` : 'N/A'}</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontWeight="bold">Follower Growth</Text>
                      <Text>{match.stats.followerGrowth ?? 'N/A'}</Text>
                    </Box>
                  </SimpleGrid>
                </>
              )}
              
            </VStack>
          </CardBody>
        </Card>
        
        {/* Action buttons if needed - e.g., Complete Match, Update Stats */}
        {match.status === 'accepted' && (
           <Button colorScheme='blue' onClick={onStatsModalOpen}>Update Stats</Button>
        )}
        {match.status === 'accepted' && (
           <Button colorScheme='green' onClick={() => alert('Complete Match TBD')}>Mark as Completed (TBD)</Button>
        )}
        
      </VStack>

      {matchId && (
        <UpdateStatsModal 
          isOpen={isStatsModalOpen}
          onClose={onStatsModalClose}
          matchId={matchId}
          currentStats={match?.stats}
        />
      )}
    </Container>
  );
};

export default MatchDetail;
