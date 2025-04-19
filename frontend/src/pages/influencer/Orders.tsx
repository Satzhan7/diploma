import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Input,
  Select,
  Button,
  Stack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  HStack,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface Order {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  requirements: string;
  deadline: string;
  status: 'open' | 'in_progress' | 'completed';
  brandName: string;
  brandId: string;
}

interface FilterState {
  category: string;
  minBudget: number;
  maxBudget: number;
  status: string;
}

export const Orders: React.FC = () => {
  const toast = useToast();
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    minBudget: 0,
    maxBudget: 100000,
    status: '',
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const response = await api.get('/orders/available', { params: filters });
      return response.data;
    },
  });

  const handleApply = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/apply`);
      toast({
        title: 'Application submitted',
        description: 'Your application has been sent to the brand',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit application',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Available Orders</Heading>

        {/* Filters */}
        <Card>
          <CardBody>
            <Stack spacing={4} direction={{ base: 'column', md: 'row' }}>
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  placeholder="All categories"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="fashion">Fashion</option>
                  <option value="beauty">Beauty</option>
                  <option value="technology">Technology</option>
                  <option value="food">Food & Beverage</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="travel">Travel</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Min Budget</FormLabel>
                <Input
                  type="number"
                  value={filters.minBudget}
                  onChange={(e) => setFilters({ ...filters, minBudget: Number(e.target.value) })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Max Budget</FormLabel>
                <Input
                  type="number"
                  value={filters.maxBudget}
                  onChange={(e) => setFilters({ ...filters, maxBudget: Number(e.target.value) })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  placeholder="All statuses"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Select>
              </FormControl>
            </Stack>
          </CardBody>
        </Card>

        {/* Orders Grid */}
        {isLoading ? (
          <Text>Loading orders...</Text>
        ) : orders?.length ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {orders.map((order: Order) => (
              <Card key={order.id}>
                <CardHeader>
                  <VStack align="stretch" spacing={2}>
                    <Heading size="md">{order.title}</Heading>
                    <HStack>
                      <Badge colorScheme="blue">{order.category}</Badge>
                      <Badge colorScheme={order.status === 'open' ? 'green' : 'orange'}>
                        {order.status}
                      </Badge>
                    </HStack>
                  </VStack>
                </CardHeader>

                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Text noOfLines={3}>{order.description}</Text>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Budget:</Text>
                      <Text>${order.budget.toLocaleString()}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Deadline:</Text>
                      <Text>{new Date(order.deadline).toLocaleDateString()}</Text>
                    </HStack>
                    <Text fontWeight="bold">Brand:</Text>
                    <Text>{order.brandName}</Text>
                  </VStack>
                </CardBody>

                <CardFooter>
                  <Button
                    colorScheme="blue"
                    width="full"
                    onClick={() => handleApply(order.id)}
                    isDisabled={order.status !== 'open'}
                  >
                    Apply Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Text>No orders available matching your filters.</Text>
        )}
      </VStack>
    </Box>
  );
}; 