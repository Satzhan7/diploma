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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  FormControl,
  FormLabel,
  Input,
  Avatar,
  AlertDialogBody,
  AlertDialogFooter,
  Portal,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ordersService, Order } from '../../services/orders';
import { applicationsService, Application } from '../../services/applications';
import { IconWrapper, IconButtonWithWrapper } from '../../components/IconWrapper';
import { FiEdit2, FiTrash2, FiEye, FiTrendingUp } from 'react-icons/fi';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { useAuth } from '../../contexts/AuthContext';

interface StatsFormData {
  clicks: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
}

const BrandOrders: React.FC = () => {
  const { user } = useAuth();
  const { isOpen: isApplicantsOpen, onOpen: onApplicantsOpen, onClose: onApplicantsClose } = useDisclosure();
  const [statsForm, setStatsForm] = useState<StatsFormData>({ clicks: 0, impressions: 0, engagementRate: 0, followerGrowth: 0 });
  const { isOpen: isStatsModalOpen, onOpen: onStatsModalOpen, onClose: onStatsModalClose } = useDisclosure();

  const updateStatsMutation = useMutation({
    mutationFn: async (data: { orderId: string; stats: StatsFormData }) => {
      console.log('Updating stats for order:', data.orderId, data.stats);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Stats Updated (Placeholder)', status: 'success' });
    },
    onError: (err) => toast({ title: 'Error Updating Stats (Placeholder)', description: (err as Error).message, status: 'error' }),
  });

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orderApplications', selectedOrder?.id] });
      queryClient.invalidateQueries({ queryKey: ['brandOrders'] });
      toast({ title: 'Application Accepted', status: 'success' });
    },
    onError: (err) => toast({ title: 'Error accepting', description: (err as Error).message, status: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsService.update(applicationId, { status: 'rejected' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orderApplications', selectedOrder?.id] });
      toast({ title: 'Application Rejected', status: 'warning' });
    },
    onError: (err) => toast({ title: 'Error rejecting', description: (err as Error).message, status: 'error' }),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => ordersService.delete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandOrders', user?.id] });
      toast({ title: 'Order Deleted', status: 'info' });
    },
    onError: (err) => toast({ title: 'Error deleting order', description: (err as Error).message, status: 'error' })
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

  const handleEditOrder = (orderId: string) => {
    navigate(`/brand/orders/edit/${orderId}`);
  };

  const handleDeleteOrder = (orderId: string) => {
    if(window.confirm('Are you sure you want to delete this order?')) {
      deleteOrderMutation.mutate(orderId);
    }
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
    } else {
      toast({ title: "Cannot update stats", description: "Order context not found.", status: "error" });
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

  const handleOpenStatsModal = (order: Order) => {
    setSelectedOrder(order);
    onStatsModalOpen();
    toast({ 
      title: "Stats Modal Triggered (UI Commented Out)",
      description: `Triggered for order ${order.id}. Match ID: ${order.match?.id}`,
      status: "info"
    }); 
  };

  const renderStatusBadge = (status: string) => {
    let colorScheme = 'gray';
    if (status === 'active' || status === 'open') colorScheme = 'green';
    if (status === 'paused') colorScheme = 'yellow';
    if (status === 'completed') colorScheme = 'blue';
    if (status === 'cancelled' || status === 'closed') colorScheme = 'red';
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

  if (!user) return <Center p={10}><Text>Loading user information...</Text></Center>;
  if (isLoading) return <Center p={10}><Spinner /></Center>;
  if (error) return <Center p={10}><Text color="red.500">Error loading orders: {error.message}</Text></Center>;

  return (
    <Box p={4}>
      <Heading mb={6}>My Brand Orders</Heading>
      <Button as={RouterLink} to="/brand/orders/create" colorScheme="blue" mb={6}>
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
                  <Text fontSize="sm">Budget: ${order.budget.toLocaleString()}</Text>
                </HStack>
              </CardHeader>
              <CardBody py={2}>
                <Text noOfLines={3}>{order.description}</Text>
              </CardBody>
              <CardFooter>
                 <HStack justify="space-between" width="100%">
                    {(() => {
                      // Calculate pending applications count
                      const pendingCount = order.applications?.filter(app => app.status === 'pending').length || 0;
                      return (
                        <Button 
                          leftIcon={<IconWrapper icon={FiEye}/>}
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewApplicants(order)}
                          // Add badge if there are pending applications
                          rightIcon={pendingCount > 0 ? 
                            <Badge colorScheme='yellow' ml='1' borderRadius='full' px='2'>
                              {pendingCount} new
                            </Badge> : undefined
                          }
                        >
                          View Applicants
                        </Button>
                      );
                    })()}
                    <Menu>
                      <MenuButton
                        as={IconButtonWithWrapper}
                        icon={BsThreeDotsVertical}
                        variant='ghost'
                        size='sm'
                        aria-label='Order actions'
                      />
                      <Portal>
                        <MenuList>
                          <MenuItem icon={<IconWrapper icon={FiTrendingUp} />} onClick={() => handleOpenStatsModal(order)}>
                            View/Update Stats
                          </MenuItem>
                          <MenuItem icon={<IconWrapper icon={FiEdit2} />} onClick={() => handleEditOrder(order.id)}>
                            Edit Order
                          </MenuItem>
                          <MenuDivider />
                          <MenuItem icon={<IconWrapper icon={FiTrash2} />} color="red.500" onClick={() => handleDeleteOrder(order.id)}>
                            Delete Order
                          </MenuItem>
                        </MenuList>
                      </Portal>
                    </Menu>
                  </HStack>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Center p={10}>
          <Text>You haven't created any orders yet.</Text>
        </Center>
      )}

      {selectedOrder && (
        <Modal isOpen={isApplicantsOpen} onClose={onApplicantsClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Applicants for "{selectedOrder.title}"</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {isLoadingApplications ? (
                <Center><Spinner /></Center>
              ) : !orderApplications || orderApplications.length === 0 ? (
                <Text>No applicants yet.</Text>
              ) : (
                <List spacing={3}>
                  {orderApplications.map(app => (
                    <ListItem key={app.id} borderWidth="1px" borderRadius="md" p={3}>
                      <HStack justify="space-between">
                         <VStack align="start" spacing={1}>
                           <HStack>
                              <Avatar size="xs" name={app.applicant?.name || 'Unknown'} src={app.applicant?.avatarUrl}/>
                              <Text fontWeight="bold">{app.applicant?.name || 'Unknown Applicant'}</Text>
                           </HStack>
                            <Text fontSize="sm">Proposed: ${app.proposedPrice.toLocaleString()}</Text>
                            <Text fontSize="sm" fontStyle="italic">"{app.message}"</Text>
                         </VStack>
                         <VStack align="end">
                           {renderApplicationStatusBadge(app.status)}
                           <HStack>
                             {app.status === 'pending' && (
                               <>
                                 <Button size="xs" colorScheme="green" onClick={() => handleAcceptApplication(app)} isLoading={acceptMutation.isPending}>
                                   Accept
                                 </Button>
                                 <Button size="xs" colorScheme="red" onClick={() => handleRejectApplication(app)} isLoading={rejectMutation.isPending}>
                                   Reject
                                 </Button>
                               </>
                             )}
                             {app.status === 'accepted' && (
                               <Button 
                                 size="xs" 
                                 colorScheme="blue" 
                                 onClick={() => handleOpenStatsModal(app.order)}
                               >
                                 Complete & Update Stats (TBD)
                               </Button>
                             )}
                           </HStack>
                           <Button size="xs" variant="link" onClick={() => app.applicant?.id && handleViewInfluencer(app.applicant.id)} isDisabled={!app.applicant?.id}>View Profile</Button>
                         </VStack>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
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
             <ModalHeader>Update Stats for "{selectedOrder.title}"</ModalHeader>
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
                 </FormControl>

                 <FormControl>
                   <FormLabel>Impressions</FormLabel>
                   <Input
                     name="impressions"
                     type="number"
                     value={statsForm.impressions}
                     onChange={handleStatsChange}
                   />
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
                 </FormControl>

                 <FormControl>
                   <FormLabel>Follower Growth</FormLabel>
                   <Input
                     name="followerGrowth"
                     type="number"
                     value={statsForm.followerGrowth}
                     onChange={handleStatsChange}
                   />
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
                 Save Stats & Complete Match
               </Button>
             </ModalFooter>
           </ModalContent>
         </Modal>
       )}
    </Box>
  );
};

export default BrandOrders;