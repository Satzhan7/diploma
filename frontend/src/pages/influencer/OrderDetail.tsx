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
} from '@chakra-ui/react';
import { ordersService, Order } from '../../services/orders';
import { IconWrapper } from '../../components/IconWrapper';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: order, isLoading, error } = useQuery<Order, Error>({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getById(orderId!), // Assuming getById exists
    enabled: !!orderId,
  });

  if (isLoading) {
    return <Center p={10}><Spinner /></Center>;
  }

  if (error) {
    toast({
      title: 'Error loading order',
      description: error.message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return <Center p={10}><Text color="red.500">Could not load order details.</Text></Center>;
  }

  if (!order) {
    return <Center p={10}><Text>Order not found.</Text></Center>;
  }

  const renderOrderStatusBadge = (status: string) => {
    let colorScheme = 'gray';
    if (status === 'open') colorScheme = 'green';
    if (status === 'in_progress') colorScheme = 'yellow';
    if (status === 'completed') colorScheme = 'blue';
    if (status === 'cancelled') colorScheme = 'red';
    return <Badge colorScheme={colorScheme}>{status}</Badge>;
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Order Details</Heading>
          <Button
            leftIcon={<IconWrapper icon={FiArrowLeft} />}
            onClick={() => navigate(-1)} // Go back
            variant="outline"
            size="sm"
          >
            Back
          </Button>
        </HStack>

        <Box borderWidth="1px" borderRadius="lg" p={6}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">{order.title}</Heading>
              {renderOrderStatusBadge(order.status)}
            </HStack>
            
            <Text color="gray.600">
              Posted by: 
              <Avatar size="sm" name={order.brand?.displayName || 'B'} src={order.brand?.avatarUrl} />
              <ChakraLink 
                to={`/profile/${order.brand?.id}`} 
                as={RouterLink} 
                fontWeight="medium" 
                ml={1} 
                color="blue.500" 
                onClick={(e) => !order.brand?.id && e.preventDefault()}
              >
                {order.brand?.displayName || 'Brand Name Missing'} <IconWrapper icon={FiExternalLink} />
              </ChakraLink>
            </Text>

            <Divider />

            <Text fontSize="lg" fontWeight="semibold">Description</Text>
            <Text>{order.description}</Text>

            <Divider />

            <HStack spacing={8}>
              <Box>
                <Text fontWeight="semibold">Budget</Text>
                <Text>${order.budget.toLocaleString()}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold">Category</Text>
                <Text>{order.category}</Text>
              </Box>
            </HStack>

            {order.requirements && (
              <>
                <Divider />
                <Text fontSize="lg" fontWeight="semibold">Requirements</Text>
                <Text>{order.requirements}</Text>
              </>
            )}
            
             {order.deadline && (
              <>
                <Divider />
                <Text fontSize="lg" fontWeight="semibold">Deadline</Text>
                <Text>{new Date(order.deadline).toLocaleDateString()}</Text>
              </>
            )}

          </VStack>
        </Box>

        {/* Add action buttons if needed, e.g., apply button if status is open */}
        {/* {order.status === 'open' && (
          <Button colorScheme="blue">Apply Now</Button>
        )} */}
        
      </VStack>
    </Container>
  );
};

export default OrderDetail; 