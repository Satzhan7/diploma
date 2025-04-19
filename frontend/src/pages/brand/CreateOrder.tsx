import React from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

interface OrderFormData {
  title: string;
  description: string;
  budget: number;
  category: string;
  requirements: string;
  deadline: string;
}

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const orderData: OrderFormData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      budget: Number(formData.get('budget')),
      category: formData.get('category') as string,
      requirements: formData.get('requirements') as string,
      deadline: formData.get('deadline') as string,
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Create New Order</Heading>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input name="title" placeholder="Enter order title" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    placeholder="Describe your order in detail"
                    rows={4}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Budget</FormLabel>
                  <NumberInput min={0} defaultValue={1000}>
                    <NumberInputField name="budget" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select name="category" placeholder="Select category">
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
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Deadline</FormLabel>
                  <Input name="deadline" type="date" />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={createOrderMutation.isPending}
                >
                  Create Order
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}; 