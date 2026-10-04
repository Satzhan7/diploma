import React, { useState } from 'react';
import {
  Box,
  Heading,
  Badge,
  Button,
  HStack,
  Text,
  useToast,
  Spinner,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  VStack,
  List,
  ListItem,
  Avatar,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ordersService, Order } from '../../services/orders';
import { applicationsService, Application } from '../../services/applications';
import { IconWrapper } from '../../components/IconWrapper';
import { FiEye } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/ui';
import { formatMoney } from '../../i18n';
import { getErrorMessage } from '../../i18n/errors';

const BrandOrders: React.FC = () => {
  const { t } = useTranslation('brand');
  const { user } = useAuth();
  const { isOpen: isApplicantsOpen, onOpen: onApplicantsOpen, onClose: onApplicantsClose } = useDisclosure();

  const { data: orders, isLoading, error } = useQuery<Order[], Error>({
    queryKey: ['brandOrders'],
    queryFn: () => ordersService.getByBrand(),
    enabled: !!user?.id,
  });

  const toast = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsService.update(applicationId, { status: 'accepted' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderApplications', selectedOrder?.id] });
      queryClient.invalidateQueries({ queryKey: ['brandOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast({ title: t('orders.toasts.accepted'), status: 'success' });
    },
    onError: (err) => toast({ title: t('orders.toasts.acceptError'), description: getErrorMessage(err), status: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsService.update(applicationId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderApplications', selectedOrder?.id] });
      toast({ title: t('orders.toasts.rejected'), status: 'warning' });
    },
    onError: (err) => toast({ title: t('orders.toasts.rejectError'), description: getErrorMessage(err), status: 'error' }),
  });

  const { data: orderApplications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['orderApplications', selectedOrder?.id],
    queryFn: () => applicationsService.getByOrder(selectedOrder!.id),
    enabled: !!selectedOrder && isApplicantsOpen,
  });

  const handleViewApplicants = (order: Order) => {
    setSelectedOrder(order);
    onApplicantsOpen();
  };

  const handleViewInfluencer = (influencerId: string) => {
    navigate(`/brand/profile/${influencerId}`);
  };

  const handleAcceptApplication = (application: Application) => {
    acceptMutation.mutate(application.id);
  };

  const handleRejectApplication = (application: Application) => {
    rejectMutation.mutate(application.id);
  };

  if (!user) return <Center p={10}><Text>{t('orders.loadingUser')}</Text></Center>;
  if (isLoading) return <Center p={10}><Spinner /></Center>;
  if (error) return <Center p={10}><Text color="danger">{t('orders.loadError', { message: getErrorMessage(error) })}</Text></Center>;

  return (
    <Box p={4}>
      <Heading mb={6}>{t('orders.title')}</Heading>
      <Button as={RouterLink} to="/brand/orders/create" colorScheme="brand" mb={6}>
        {t('orders.createNew')}
      </Button>

      {orders && orders.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {orders.map(order => (
            <Card key={order.id} overflow="hidden" variant="outline">
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md" noOfLines={1}>{order.title}</Heading>
                  <StatusBadge status={order.status} />
                </HStack>
                <HStack mt={2} spacing={2}>
                  <Badge>{t(`categories.${order.category?.toLowerCase()}`, { defaultValue: order.category })}</Badge>
                  <Text fontSize="sm">{t('orders.budget', { amount: formatMoney(order.budget) })}</Text>
                </HStack>
              </CardHeader>
              <CardBody py={2}>
                <Text noOfLines={3}>{order.description}</Text>
              </CardBody>
              <CardFooter>
                <HStack justify="space-between" width="100%">
                  {(() => {
                    const pendingCount = order.applications?.filter(app => app.status === 'pending').length || 0;
                    return (
                      <Button
                        leftIcon={<IconWrapper icon={FiEye}/>}
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewApplicants(order)}
                        rightIcon={pendingCount > 0 ?
                          <Badge colorScheme='yellow' ml='1' borderRadius='full' px='2'>
                            {t('orders.newApplications', { count: pendingCount })}
                          </Badge> : undefined
                        }
                      >
                        {t('orders.viewApplicants')}
                      </Button>
                    );
                  })()}
                  {/* Order edit/delete arrive with the brief model in R3. */}
                </HStack>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Center p={10}>
          <Text>{t('orders.empty')}</Text>
        </Center>
      )}

      {selectedOrder && (
        <Modal isOpen={isApplicantsOpen} onClose={onApplicantsClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{t('orders.applicants.title', { title: selectedOrder.title })}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {isLoadingApplications ? (
                <Center><Spinner /></Center>
              ) : !orderApplications || orderApplications.length === 0 ? (
                <Text>{t('orders.applicants.empty')}</Text>
              ) : (
                <List spacing={3}>
                  {orderApplications.map(app => (
                    <ListItem key={app.id} borderWidth="1px" borderRadius="md" p={3}>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Avatar size="xs" name={app.applicant?.name || t('orders.applicants.unknown')} src={app.applicant?.avatarUrl}/>
                            <Text fontWeight="bold">{app.applicant?.name || t('orders.applicants.unknown')}</Text>
                          </HStack>
                          <Text fontSize="sm">{t('orders.applicants.proposed', { amount: formatMoney(app.proposedPrice) })}</Text>
                          <Text fontSize="sm" fontStyle="italic">{t('orders.applicants.message', { message: app.message })}</Text>
                        </VStack>
                        <VStack align="end">
                          <StatusBadge status={app.status} />
                          <HStack>
                            {app.status === 'pending' && (
                              <>
                                <Button size="xs" colorScheme="accent" onClick={() => handleAcceptApplication(app)} isLoading={acceptMutation.isPending}>
                                  {t('orders.applicants.accept')}
                                </Button>
                                <Button size="xs" colorScheme="red" onClick={() => handleRejectApplication(app)} isLoading={rejectMutation.isPending}>
                                  {t('orders.applicants.reject')}
                                </Button>
                              </>
                            )}
                          </HStack>
                          <Button size="xs" variant="link" onClick={() => app.applicant?.id && handleViewInfluencer(app.applicant.id)} isDisabled={!app.applicant?.id}>{t('orders.applicants.viewProfile')}</Button>
                        </VStack>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onApplicantsClose}>{t('common:actions.close')}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default BrandOrders;
