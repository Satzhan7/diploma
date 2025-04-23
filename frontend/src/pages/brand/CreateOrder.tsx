import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Card,
  CardBody,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface OrderFormData {
  title: string;
  description: string;
  budget: number;
  category: string;
  requirements: string;
  deadline: string;
}

interface CreateOrderProps {
  isEditMode?: boolean;
}

export const CreateOrder: React.FC<CreateOrderProps> = ({ isEditMode }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { orderId } = useParams<{ orderId: string }>();
  const [formData, setFormData] = useState<OrderFormData>({
    title: '',
    description: '',
    budget: 1000,
    category: '',
    requirements: '',
    deadline: '',
  });

  // Загрузка существующего заказа для редактирования
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (isEditMode && orderId) {
        const response = await api.get(`/orders/${orderId}`);
        return response.data;
      }
      return null;
    },
    enabled: isEditMode === true && !!orderId,
  });

  // Обновляем форму при загрузке данных заказа
  useEffect(() => {
    if (orderData) {
      const deadline = new Date(orderData.deadline);
      const formattedDeadline = deadline.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      setFormData({
        title: orderData.title,
        description: orderData.description,
        budget: orderData.budget,
        category: orderData.category,
        requirements: orderData.requirements,
        deadline: formattedDeadline,
      });
    }
  }, [orderData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? Number(value) : value,
    }));
  };

  const handleNumberInputChange = (valueAsString: string, valueAsNumber: number) => {
    setFormData(prev => ({
      ...prev,
      budget: valueAsNumber,
    }));
  };

  const createOrderMutation = useMutation({
    mutationFn: (data: OrderFormData) => api.post('/orders', data),
    onSuccess: () => {
      toast({
        title: 'Order created',
        description: 'Your order has been successfully created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard/brand/orders');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create order',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: OrderFormData) => api.patch(`/orders/${orderId}`, data),
    onSuccess: () => {
      toast({
        title: 'Order updated',
        description: 'Your order has been successfully updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard/brand/orders');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update order',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isEditMode) {
      updateOrderMutation.mutate(formData);
    } else {
      createOrderMutation.mutate(formData);
    }
  };

  if (isEditMode && isLoading) {
    return (
      <Center p={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">{isEditMode ? 'Edit Order' : 'Create New Order'}</Heading>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input 
                    name="title"
                    placeholder="Enter order title" 
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    placeholder="Describe your order in detail"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Budget</FormLabel>
                  <NumberInput 
                    min={0} 
                    value={formData.budget}
                    onChange={handleNumberInputChange}
                  >
                    <NumberInputField name="budget" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    name="category" 
                    placeholder="Select category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="fashion">Fashion</option>
                    <option value="beauty">Beauty</option>
                    <option value="technology">Technology</option>
                    <option value="food">Food & Beverage</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="travel">Travel</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Requirements</FormLabel>
                  <Textarea
                    name="requirements"
                    placeholder="List your specific requirements"
                    rows={4}
                    value={formData.requirements}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Deadline</FormLabel>
                  <Input 
                    name="deadline" 
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={isEditMode ? updateOrderMutation.isPending : createOrderMutation.isPending}
                >
                  {isEditMode ? 'Update Order' : 'Create Order'}
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}; 