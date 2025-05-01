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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Order } from '../../services/orders';
import { Application, applicationsService } from '../../services/applications';
import { useAuth } from '../../contexts/AuthContext';

interface FilterState {
  category: string;
  minBudget: number;
  maxBudget: number;
}

interface ApplicationFormData {
  message: string;
  proposedPrice: number;
}

export const Orders: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormData>({
    message: '',
    proposedPrice: 0,
  });
  const [filters, setFilters] = useState<Omit<FilterState, 'status'>>({
    category: '',
    minBudget: 0,
    maxBudget: 100000,
  });
  const { user } = useAuth();

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['availableOrders', filters],
    queryFn: async () => {
      const response = await api.get('/orders/available', { params: filters });
      return response.data;
    },
  });

  const { data: myApplications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['myApplications', user?.id],
    queryFn: () => applicationsService.getMyApplications(),
    enabled: !!user,
  });

  const myApplicationsMap = React.useMemo(() => {
    if (!myApplications) return {};
    return myApplications.reduce((acc, app) => {
      acc[app.order.id] = app;
      return acc;
    }, {} as Record<string, Application>);
  }, [myApplications]);

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: { orderId: string, application: ApplicationFormData }) => {
      console.log('Submitting application:', data);
      try {
        const response = await api.post(`/order-applications/${data.orderId}`, data.application);
        console.log('Application submitted successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error submitting application:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      toast({
        title: 'Application submitted',
        description: 'Your application has been sent to the brand',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error('Mutation error handler:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit application',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleOpenApplicationForm = (order: Order) => {
    setSelectedOrder(order);
    setApplicationForm(prev => ({
      ...prev,
      proposedPrice: order.budget,
    }));
    onOpen();
  };

  const handleSubmitApplication = () => {
    if (!selectedOrder) return;
    
    // Подготовка данных заявки
    const application = {
      message: applicationForm.message,
      proposedPrice: applicationForm.proposedPrice
    };
    
    console.log('Preparing to submit application:', {
      orderId: selectedOrder.id,
      application: application
    });
    
    submitApplicationMutation.mutate({
      orderId: selectedOrder.id,
      application: application,
    });
  };

  const resetForm = () => {
    setApplicationForm({
      message: '',
      proposedPrice: 0,
    });
    setSelectedOrder(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicationForm(prev => ({
      ...prev,
      [name]: name === 'proposedPrice' ? Number(value) : value,
    }));
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
            </Stack>
          </CardBody>
        </Card>

        {/* Orders Grid */}
        {isLoadingOrders ? (
          <Text>Loading orders...</Text>
        ) : orders?.length ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {orders.map((order: Order) => {
              const myApplication = myApplicationsMap[order.id];

              return (
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
                        <Text>{order.deadline ? new Date(order.deadline).toLocaleDateString() : 'N/A'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Brand:</Text>
                        <Text fontWeight="medium">{order.brand?.displayName || 'N/A'}</Text>
                      </HStack>
                    </VStack>
                  </CardBody>

                  <CardFooter>
                    {myApplication ? (
                      <VStack align="stretch" spacing={1} width="full">
                        <Badge 
                          colorScheme={myApplication.status === 'pending' ? 'yellow' : 
                                       myApplication.status === 'accepted' ? 'green' : 
                                       myApplication.status === 'rejected' ? 'red' : 
                                       'purple'} 
                          textAlign="center"
                        >
                          Applied ({myApplication.status})
                        </Badge>
                        {myApplication.message && (
                          <Text fontSize="xs" fontStyle="italic" noOfLines={1} title={myApplication.message}>
                             Your message: "{myApplication.message}"
                          </Text>
                        )}
                      </VStack>
                    ) : (
                      <Button
                        colorScheme="blue"
                        width="full"
                        onClick={() => handleOpenApplicationForm(order)}
                        isDisabled={order.status !== 'open'}
                      >
                        Apply Now
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </SimpleGrid>
        ) : (
          <Text>No orders available matching your filters.</Text>
        )}

        {/* Application Form Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Apply for {selectedOrder?.title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Your Message to the Brand</FormLabel>
                  <Textarea
                    name="message"
                    value={applicationForm.message}
                    onChange={handleInputChange}
                    placeholder="Explain why you're a good fit for this order and what you can offer..."
                    rows={5}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Your Proposed Price ($)</FormLabel>
                  <Input
                    name="proposedPrice"
                    type="number"
                    value={applicationForm.proposedPrice}
                    onChange={handleInputChange}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Original budget: ${selectedOrder?.budget.toLocaleString()}
                  </Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleSubmitApplication}
                isLoading={submitApplicationMutation.isPending}
                isDisabled={!applicationForm.message}
              >
                Submit Application
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
}; 