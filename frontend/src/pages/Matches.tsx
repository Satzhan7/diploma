import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FiAward } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import { Match, matchingService } from '../services/matching';
import { PageHeader, StatusBadge, EmptyState, CardGridSkeleton } from '../components/ui';

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

  const counterpartLabel = user?.role === UserRole.BRAND ? 'influencers' : 'brands';

  return (
    <Container maxW="container.xl" px={0}>
      <PageHeader
        title="My Matches"
        subtitle={`Your collaborations with ${counterpartLabel}`}
      />

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : !matches || matches.length === 0 ? (
        <EmptyState
          icon={FiAward}
          title="No matches yet"
          description={
            user?.role === UserRole.BRAND
              ? 'Accept an application or send a collaboration request to start a match.'
              : 'Apply to orders or express interest in brands to start a match.'
          }
        />
      ) : (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
          {matches.map((match) => (
            <Card key={match.id}>
              <CardBody p={5}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="600" fontSize="sm" color="fg.muted">
                      Match {match.id.substring(0, 8)}…
                    </Text>
                    <StatusBadge status={match.status} />
                  </HStack>

                  <VStack align="start" spacing={0}>
                    {user?.role === UserRole.BRAND && match.influencer && (
                      <>
                        <Text fontSize="sm" color="fg.subtle">Influencer</Text>
                        <Text fontWeight="600">{match.influencer.name || 'N/A'}</Text>
                      </>
                    )}
                    {user?.role === UserRole.INFLUENCER && match.brand && (
                      <>
                        <Text fontSize="sm" color="fg.subtle">Brand</Text>
                        <Text fontWeight="600">{match.brand.name || 'N/A'}</Text>
                      </>
                    )}
                  </VStack>

                  <Box>
                    <Text fontSize="sm" color="fg.subtle">Created</Text>
                    <Text fontSize="sm">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>

                  {user?.role === UserRole.INFLUENCER && match.status === 'pending' && (
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="accent"
                        onClick={() => acceptMutation.mutate(match.id)}
                        isLoading={acceptMutation.isPending}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => rejectMutation.mutate(match.id)}
                        isLoading={rejectMutation.isPending}
                      >
                        Reject
                      </Button>
                    </HStack>
                  )}

                  <Button
                    variant="outline"
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
      )}
    </Container>
  );
};

export default Matches;
