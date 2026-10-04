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
import { useTranslation } from 'react-i18next';
import { formatDate, formatMoney } from '../../i18n';
import { StatusBadge } from '../../components/ui';
import { getErrorMessage } from '../../i18n/errors';

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation('influencer');
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
      title: t('orderDetail.loadErrorTitle'),
      description: getErrorMessage(error),
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return <Center p={10}><Text color="danger">{t('orderDetail.loadError')}</Text></Center>;
  }

  if (!order) {
    return <Center p={10}><Text>{t('orderDetail.notFound')}</Text></Center>;
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">{t('orderDetail.title')}</Heading>
          <Button
            leftIcon={<IconWrapper icon={FiArrowLeft} />}
            onClick={() => navigate(-1)} // Go back
            variant="outline"
            size="sm"
          >
            {t('common:actions.back')}
          </Button>
        </HStack>

        <Box borderWidth="1px" borderRadius="lg" p={6}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">{order.title}</Heading>
              <StatusBadge status={order.status} />
            </HStack>
            
            <Text color="fg.muted">
              {t('orderDetail.postedBy')}
              <Avatar size="sm" name={order.brand?.displayName || 'B'} src={order.brand?.avatarUrl} />
              <ChakraLink 
                to={`/influencer/profile/${order.brand?.user?.id}`}
                as={RouterLink} 
                fontWeight="medium" 
                ml={1} 
                color="primary.ink" 
                onClick={(e) => !order.brand?.user?.id && e.preventDefault()}
              >
                {order.brand?.displayName || t('shared.brandNameMissing')} <IconWrapper icon={FiExternalLink} />
              </ChakraLink>
            </Text>

            <Divider />

            <Text fontSize="lg" fontWeight="semibold">{t('orderDetail.description')}</Text>
            <Text>{order.description}</Text>

            <Divider />

            <HStack spacing={8}>
              <Box>
                <Text fontWeight="semibold">{t('orderDetail.budget')}</Text>
                <Text>{formatMoney(order.budget)}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold">{t('orderDetail.category')}</Text>
                <Text>{order.category}</Text>
              </Box>
            </HStack>

            {order.requirements && (
              <>
                <Divider />
                <Text fontSize="lg" fontWeight="semibold">{t('orderDetail.requirements')}</Text>
                <Text>{order.requirements}</Text>
              </>
            )}
            
             {order.deadline && (
              <>
                <Divider />
                <Text fontSize="lg" fontWeight="semibold">{t('orderDetail.deadline')}</Text>
                <Text>{formatDate(order.deadline)}</Text>
              </>
            )}

          </VStack>
        </Box>

        {/* Add action buttons if needed, e.g., apply button if status is open */}
        {/* {order.status === 'open' && (
          <Button colorScheme="brand">Apply Now</Button>
        )} */}
        
      </VStack>
    </Container>
  );
};

export default OrderDetail; 