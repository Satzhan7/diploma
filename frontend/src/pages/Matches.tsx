import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import { Match, matchingService } from '../services/matching';

export const Matches: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const queryKey = ['userMatches', user?.id];

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: queryKey,
    queryFn: async () => {
      if (!user) return [];
      return matchingService.getUserMatches();
    },
    enabled: !!user,
  });

  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'accepted':
        return 'green';
      case 'completed':
        return 'blue';
      case 'rejected':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const acceptMutation = useMutation({
    mutationFn: (matchId: string) => matchingService.acceptMatch(matchId),
    onSuccess: () => {
      toast({ title: "Match Accepted!", status: "success" });
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onError: (error: any) => {
      toast({ title: "Error accepting match", description: error.message, status: "error" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (matchId: string) => matchingService.rejectMatch(matchId),
    onSuccess: () => {
      toast({ title: "Match Rejected", status: "warning" });
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onError: (error: any) => {
      toast({ title: "Error rejecting match", description: error.message, status: "error" });
    },
  });

  if (isLoading) {
    return <Box p={4}>Loading matches...</Box>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">My Matches</Heading>
        
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
          {matches?.map((match) => (
            <Card key={match.id}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Match ID: {match.id.substring(0, 8)}...</Text>
                    <Badge colorScheme={getStatusColor(match.status)}>
                      {match.status}
                    </Badge>
                  </HStack>

                  <Box>
                    <Text fontSize="sm" color="gray.600">Created</Text>
                    <Text fontSize="sm">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>

                  <VStack align="start" spacing={0}>
                    {user?.role === UserRole.BRAND && match.influencer && (
                      <> 
                        <Text fontSize="sm" color="gray.500">Influencer:</Text>
                        <Text fontWeight="medium">{match.influencer.name || 'N/A'}</Text>
                      </>
                    )}
                     {user?.role === UserRole.INFLUENCER && match.brand && (
                      <> 
                        <Text fontSize="sm" color="gray.500">Brand:</Text>
                        <Text fontWeight="medium">{match.brand.name || 'N/A'}</Text>
                      </>
                    )}
                  </VStack>

                  {user?.role === UserRole.INFLUENCER && match.status === 'pending' && (
                    <HStack mt={2}>
                      <Button 
                        size="xs" 
                        colorScheme="green" 
                        onClick={() => acceptMutation.mutate(match.id)}
                        isLoading={acceptMutation.isPending}
                      >
                        Accept
                      </Button>
                      <Button 
                        size="xs" 
                        colorScheme="red" 
                        onClick={() => rejectMutation.mutate(match.id)}
                        isLoading={rejectMutation.isPending}
                      >
                        Reject
                      </Button>
                    </HStack>
                  )}

                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => navigate(`/${user?.role}/matches/${match.id}`)}
                  >
                    View Details
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </VStack>
    </Container>
  );
};

export default Matches; 