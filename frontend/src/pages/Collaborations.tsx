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
  Avatar,
  Progress,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface Collaboration {
  id: string;
  brand: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  influencer: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  order: {
    id: string;
    title: string;
    budget: number;
  };
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
}

export const Collaborations: React.FC = () => {
  const toast = useToast();

  const { data: collaborations, isLoading } = useQuery<Collaboration[]>({
    queryKey: ['collaborations'],
    queryFn: async () => {
      const response = await api.get('/collaborations');
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (isLoading) {
    return <Box p={4}>Loading collaborations...</Box>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">My Collaborations</Heading>
        
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
          {collaborations?.map((collab) => (
            <Card key={collab.id}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <HStack>
                      <Avatar size="sm" name={collab.brand.name} src={collab.brand.avatarUrl} />
                      <Text fontWeight="medium">{collab.brand.name}</Text>
                    </HStack>
                    <Badge colorScheme={getStatusColor(collab.status)}>
                      {collab.status}
                    </Badge>
                  </HStack>

                  <Box>
                    <Text fontSize="sm" color="gray.600">Order</Text>
                    <Text fontWeight="medium">{collab.order.title}</Text>
                    <Text fontSize="sm" color="gray.600">
                      Budget: ${collab.order.budget}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">Progress</Text>
                    <Progress value={collab.progress} colorScheme="blue" size="sm" />
                    <Text fontSize="sm" mt={1}>{collab.progress}% complete</Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">Timeline</Text>
                    <Text fontSize="sm">
                      {new Date(collab.startDate).toLocaleDateString()} - {new Date(collab.endDate).toLocaleDateString()}
                    </Text>
                  </Box>

                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => {
                      // Navigate to collaboration details
                      toast({
                        title: 'Coming soon',
                        description: 'Collaboration details page will be available soon',
                        status: 'info',
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
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