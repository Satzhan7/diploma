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
  Tag,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  VStack,
  List,
  ListItem,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  IconButton,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ordersService, Order, Application } from '../../services/orders';
import { IconWrapper, IconButtonWithWrapper } from '../../components/IconWrapper';
import { FiEdit2, FiTrash2, FiEye, FiTrendingUp } from 'react-icons/fi';
import { BsThreeDotsVertical } from 'react-icons/bs';

interface StatsFormData {
  clicks: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
}

const BrandOrders: React.FC = () => {
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isApplicantsOpen, onOpen: onApplicantsOpen, onClose: onApplicantsClose } = useDisclosure();
  const { isOpen: isStatsModalOpen, onOpen: onStatsModalOpen, onClose: onStatsModalClose } = useDisclosure();
  const [statsForm, setStatsForm] = useState<StatsFormData>({ clicks: 0, impressions: 0, engagementRate: 0, followerGrowth: 0 });

  const updateStatsMutation = useMutation({
    mutationFn: async (data: { orderId: string; stats: StatsFormData }) => {
      console.log('Updating stats for order:', data.orderId, data.stats);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Stats Updated (Placeholder)', status: 'success' });
      onStatsModalClose();
    },
    onError: (err) => toast({ title: 'Error Updating Stats (Placeholder)', description: (err as Error).message, status: 'error' }),
  });

  const { data: orders, isLoading, error } = useQuery<Order[], Error>({
    queryKey: ['brandOrders'],
    queryFn: ordersService.getBrandOrders,
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) => ordersService.acceptApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderApplications', selectedOrder?.id] });
      toast({ title: 'Application Accepted', status: 'success' });
    },
    onError: (err) => toast({ title: 'Error accepting', description: (err as Error).message, status: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) => ordersService.rejectApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderApplications', selectedOrder?.id] });
      toast({ title: 'Application Rejected', status: 'warning' });
    },
    onError: (err) => toast({ title: 'Error rejecting', description: (err as Error).message, status: 'error' }),
  });

  const deleteOrderMutation = useMutation({
      mutationFn: (orderId: string) => ordersService.deleteOrder(orderId),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['brandOrders'] });
          toast({ title: 'Order Deleted', status: 'info' });
      },
      onError: (err) => toast({ title: 'Error deleting order', description: (err as Error).message, status: 'error' })
  });

  const { data: orderApplications, isLoading: isLoadingApplications } = useQuery<Application[]>({
     queryKey: ['orderApplications', selectedOrder?.id],
     queryFn: () => ordersService.getOrderApplications(selectedOrder!.id),
     enabled: !!selectedOrder && isApplicantsOpen,
   });

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    onDetailsOpen();
  };

  const handleViewApplicants = (order: Order) => {
    setSelectedOrder(order);
    onApplicantsOpen();
  };

  const handleEditOrder = (orderId: string) => {
    navigate(`/orders/edit/${orderId}`);
  };

  const handleDeleteOrder = (orderId: string) => {
      if(window.confirm('Are you sure you want to delete this order?')) {
          deleteOrderMutation.mutate(orderId);
      }
  };

  const handleOpenStatsModal = (order: Order) => {
     setSelectedOrder(order);
     setStatsForm({ clicks: 0, impressions: 0, engagementRate: 0, followerGrowth: 0 });
     onStatsModalOpen();
   };

  const handleStatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStatsForm(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleStatsSubmit = () => {
    if (selectedOrder) {
      updateStatsMutation.mutate({ orderId: selectedOrder.id, stats: statsForm });
    }
  };

  const handleViewInfluencer = (influencerId: string) => {
      navigate(`/profile/${influencerId}`);
   };

   const handleAcceptApplication = (application: Application) => {
      acceptMutation.mutate(application.id);
   };

   const handleRejectApplication = (application: Application) => {
      rejectMutation.mutate(application.id);
   };

  const renderStatusBadge = (status: string) => {
    let colorScheme = 'gray';
    if (status === 'active') colorScheme = 'green';
    if (status === 'paused') colorScheme = 'yellow';
    if (status === 'completed') colorScheme = 'blue';
    if (status === 'cancelled') colorScheme = 'red';
    return <Badge colorScheme={colorScheme}>{status}</Badge>;
  };

  const renderApplicationStatusBadge = (status: string) => {
    let colorScheme = 'gray';
    if (status === 'accepted') colorScheme = 'green';
    if (status === 'pending') colorScheme = 'yellow';
    if (status === 'rejected') colorScheme = 'red';
    if (status === 'withdrawn') colorScheme = 'purple';
    return <Badge colorScheme={colorScheme}>{status}</Badge>;
  };

  if (isLoading) return <Center p={10}><Spinner /></Center>;
  if (error) return <Center p={10}><Text color="red.500">Error loading orders: {error.message}</Text></Center>;

  return (
    <Box p={4}>
      <Heading mb={6}>My Orders</Heading>
      <Button as={RouterLink} to="/orders/create" colorScheme="blue" mb={6}>
        Create New Order
      </Button>

      {orders && orders.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {orders.map(order => (
            <Card key={order.id} overflow="hidden" variant="outline">
              <CardHeader>
                 <HStack justify="space-between">
                   <Heading size="md" noOfLines={1}>{order.title}</Heading>
                   {renderStatusBadge(order.status)}
                 </HStack>
                <HStack mt={2} spacing={2}>
                  <Badge>{order.category}</Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Text noOfLines={2}>{order.description}</Text>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Budget:</Text>
                    <Text>${order.budget.toLocaleString()}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Deadline:</Text>
                    <Text>{new Date(order.deadline).toLocaleDateString()}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Applications:</Text>
                     <Button variant="link" colorScheme="blue" size="sm" onClick={() => handleViewApplicants(order)}>
                       {order.applications?.length || 0} View
                     </Button>
                  </HStack>
                </VStack>
              </CardBody>
              <CardFooter>
                 <Menu>
                   <MenuButton
                     as={IconButtonWithWrapper}
                     icon={<BsThreeDotsVertical />}
                     variant="ghost"
                     size="sm"
                     aria-label="Actions"
                   />
                   <MenuList>
                     <MenuItem
                       icon={<IconWrapper icon={FiEye} size="1.25em" />}
                       onClick={() => handleViewApplicants(order)}
                     >
                       View Applications
                     </MenuItem>
                     <MenuItem
                       icon={<IconWrapper icon={FiEdit2} size="1.25em" />}
                       onClick={() => handleEditOrder(order.id)}
                     >
                       Edit Order
                     </MenuItem>
                     <MenuItem
                       icon={<IconWrapper icon={FiTrendingUp} size="1.25em" />}
                       onClick={() => handleOpenStatsModal(order)}
                     >
                       Update Stats
                     </MenuItem>
                     <MenuDivider />
                     <MenuItem
                       icon={<IconWrapper icon={FiTrash2} size="1.25em" />}
                       onClick={() => handleDeleteOrder(order.id)}
                       color="red.500"
                     >
                       Delete Order
                     </MenuItem>
                   </MenuList>
                 </Menu>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" p={8}>
          <Text mb={4}>You haven't created any orders yet.</Text>
          <Button colorScheme="blue" onClick={() => navigate('/orders/create')}>
            Create Your First Order
          </Button>
        </Box>
      )}

      {selectedOrder && (
        <Modal isOpen={isApplicantsOpen} onClose={onApplicantsClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Applications for: {selectedOrder.title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
               {isLoadingApplications ? (
                 <Center><Spinner /></Center>
               ) : orderApplications && orderApplications.length > 0 ? (
                 <List spacing={4}>
                   {orderApplications.map((application: Application) => (
                     <ListItem key={application.id}>
                       <Card variant="outline">
                         <CardBody>
                           <VStack align="stretch" spacing={3}>
                             <HStack justify="space-between">
                               <Text fontWeight="bold">{application.applicant?.name || 'Unknown Applicant'}</Text>
                               {renderApplicationStatusBadge(application.status)}
                             </HStack>
                             <Text>{application.message}</Text>
                             {application.proposedPrice && (
                               <HStack justify="space-between">
                                 <Text fontWeight="semibold">Proposed Price:</Text>
                                 <Text>${application.proposedPrice.toLocaleString()}</Text>
                               </HStack>
                             )}
                             <Text fontSize="sm" color="gray.500">
                               Applied on {new Date(application.createdAt).toLocaleDateString()}
                             </Text>
                             <Divider />
                             <HStack spacing={2} justify="space-between">
                               <Button
                                 size="sm"
                                 onClick={() => handleViewInfluencer(application.applicant.id)}
                               >
                                 View Profile
                               </Button>
                               {application.status === 'pending' && (
                                 <HStack>
                                   <Button
                                     size="sm"
                                     colorScheme="green"
                                     onClick={() => handleAcceptApplication(application)}
                                     isLoading={acceptMutation.isPending && acceptMutation.variables === application.id}
                                   >
                                     Accept
                                   </Button>
                                   <Button
                                     size="sm"
                                     colorScheme="red"
                                     onClick={() => handleRejectApplication(application)}
                                     isLoading={rejectMutation.isPending && rejectMutation.variables === application.id}
                                   >
                                     Reject
                                   </Button>
                                 </HStack>
                               )}
                             </HStack>
                           </VStack>
                         </CardBody>
                       </Card>
                     </ListItem>
                   ))}
                 </List>
               ) : (
                 <Text>No applications yet for this order.</Text>
               )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onApplicantsClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {selectedOrder && (
         <Modal isOpen={isStatsModalOpen} onClose={onStatsModalClose}>
           <ModalOverlay />
           <ModalContent>
             <ModalHeader>Update Campaign Statistics for: {selectedOrder.title}</ModalHeader>
             <ModalCloseButton />
             <ModalBody>
               <VStack spacing={4}>
                 <FormControl>
                   <FormLabel>Clicks</FormLabel>
                   <Input
                     name="clicks"
                     type="number"
                     value={statsForm.clicks}
                     onChange={handleStatsChange}
                   />
                   <FormHelperText>Number of new clicks</FormHelperText>
                 </FormControl>

                 <FormControl>
                   <FormLabel>Impressions</FormLabel>
                   <Input
                     name="impressions"
                     type="number"
                     value={statsForm.impressions}
                     onChange={handleStatsChange}
                   />
                   <FormHelperText>Number of new impressions</FormHelperText>
                 </FormControl>

                 <FormControl>
                   <FormLabel>Engagement Rate (%)</FormLabel>
                   <Input
                     name="engagementRate"
                     type="number"
                     step="0.1"
                     value={statsForm.engagementRate}
                     onChange={handleStatsChange}
                   />
                   <FormHelperText>Current engagement rate percentage</FormHelperText>
                 </FormControl>

                 <FormControl>
                   <FormLabel>Follower Growth</FormLabel>
                   <Input
                     name="followerGrowth"
                     type="number"
                     value={statsForm.followerGrowth}
                     onChange={handleStatsChange}
                   />
                   <FormHelperText>Number of new followers gained</FormHelperText>
                 </FormControl>
               </VStack>
             </ModalBody>

             <ModalFooter>
               <Button variant="ghost" mr={3} onClick={onStatsModalClose}>
                 Cancel
               </Button>
               <Button
                 colorScheme="blue"
                 onClick={handleStatsSubmit}
                 isLoading={updateStatsMutation.isPending}
               >
                 Update
               </Button>
             </ModalFooter>
           </ModalContent>
         </Modal>
       )}
    </Box>
  );
};

export default BrandOrders;