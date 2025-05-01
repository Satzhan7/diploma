import React, { useState } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  HStack,
  VStack,
  Button,
  useToast,
  Link as ChakraLink,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsService, Application } from '../../services/applications';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { IconWrapper, IconButtonWithWrapper } from '../../components/IconWrapper';
import { FiExternalLink, FiTrash2, FiEye } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const MyApplications: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<Application | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const { data: applications, isLoading, error } = useQuery<Application[], Error>({
    queryKey: ['myApplications', user?.id],
    queryFn: () => applicationsService.getByInfluencer(user!.id),
    enabled: !!user,
  });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsService.update(applicationId, { status: 'withdrawn' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications', user?.id] });
      toast({ title: 'Application Withdrawn', status: 'info' });
      onClose();
      setApplicationToWithdraw(null); // Clear selection after withdrawal
    },
    onError: (err) => {
      toast({ title: 'Error withdrawing application', description: (err as Error).message, status: 'error' });
      onClose();
    },
  });

  const handleWithdrawClick = (application: Application) => {
    setApplicationToWithdraw(application);
    onOpen();
  };

  const confirmWithdraw = () => {
    if (applicationToWithdraw) {
      withdrawMutation.mutate(applicationToWithdraw.id);
    }
  };

  const handleViewOrder = (orderId: string) => {
    console.log('View order:', orderId);
    toast({ title: 'Order details view not implemented yet.', status: 'warning' });
    // navigate(`/orders/${orderId}`); // Uncomment when order detail page exists
  };

  const handleViewBrand = (brandId: string) => {
    navigate(`/profile/${brandId}`);
  };

  const renderApplicationStatusBadge = (status: string) => {
    let colorScheme = 'gray';
    if (status === 'accepted') colorScheme = 'green';
    if (status === 'pending') colorScheme = 'yellow';
    if (status === 'rejected') colorScheme = 'red';
    if (status === 'withdrawn') colorScheme = 'purple';
    return <Badge colorScheme={colorScheme}>{status}</Badge>;
  };

  const renderApplicationCard = (application: Application) => (
    <Card key={application.id} variant="outline">
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <Heading size="md" noOfLines={1} title={application.order.title}>
            <ChakraLink as={RouterLink} to={`/orders/${application.order.id}`} isExternal={false}>
              {application.order.title}
            </ChakraLink>
          </Heading>
          {renderApplicationStatusBadge(application.status)}
        </HStack>
      </CardHeader>
      <CardBody py={2}>
        <VStack align="start" spacing={1}>
          <Text fontSize="sm">
            Brand:
            <ChakraLink ml={1} color="blue.500" onClick={() => handleViewBrand(application.order.brand.id)}>
              {application.order.brand.name || 'Brand Name Missing'} <IconWrapper icon={FiExternalLink} />
            </ChakraLink>
          </Text>
          <Text fontSize="sm">Category: {application.order.category}</Text>
          <Text fontSize="sm">Applied on: {new Date(application.createdAt).toLocaleDateString()}</Text>
          {application.message && <Text fontSize="sm" mt={2} fontStyle="italic">Your message: "{application.message}"</Text>}
        </VStack>
      </CardBody>
      <CardFooter pt={2}>
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<IconWrapper icon={FiEye} />}
            onClick={() => handleViewOrder(application.order.id)}
            isDisabled // Disable until order detail view is implemented
          >
            View Order
          </Button>
          {(application.status === 'pending' || application.status === 'accepted') && (
            <IconButtonWithWrapper
              icon={FiTrash2}
              size="sm"
              colorScheme="red"
              aria-label="Withdraw Application"
              onClick={() => handleWithdrawClick(application)}
              isLoading={withdrawMutation.isPending && applicationToWithdraw?.id === application.id}
            />
          )}
        </HStack>
      </CardFooter>
    </Card>
  );

  if (isLoading) return <Center p={10}><Spinner /></Center>;
  if (error) return <Center p={10}><Text color="red.500">Error loading applications: {error.message}</Text></Center>;
  // Now explicitly check if applications is defined *before* rendering tabs
  // This handles the case where the query finishes but returns undefined/null
  if (!applications) return <Center p={10}><Text>No applications found.</Text></Center>; 


  // Filter applications *once* after loading and error checks
  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');
  const withdrawnApplications = applications.filter(app => app.status === 'withdrawn');

  return (
    <Box p={4}>
      <Heading mb={6}>My Applications</Heading>

      <Tabs variant="soft-rounded" colorScheme="blue">
        <TabList mb={4} flexWrap="wrap">
          <Tab>All ({applications.length})</Tab>
          <Tab>Pending ({pendingApplications.length})</Tab>
          <Tab>Accepted ({acceptedApplications.length})</Tab>
          <Tab>Rejected ({rejectedApplications.length})</Tab>
          <Tab>Withdrawn ({withdrawnApplications.length})</Tab>
        </TabList>

        <TabPanels>
          {/* ALL Tab */}
          <TabPanel>
            {applications.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {applications.map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text fontSize="xl">No applications found.</Text>
                <Text color="gray.500">Apply to orders that match your profile!</Text>
                <Button mt={4} colorScheme="blue" as={RouterLink} to="/influencer/orders">Browse Orders</Button>
              </Box>
            )}
          </TabPanel>

          {/* PENDING Tab */}
          <TabPanel>
            {pendingApplications.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {pendingApplications.map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text fontSize="xl">No pending applications.</Text>
                <Text color="gray.500">Your active applications will appear here.</Text>
              </Box>
            )}
          </TabPanel>

          {/* ACCEPTED Tab */}
          <TabPanel>
            {acceptedApplications.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {acceptedApplications.map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text fontSize="xl">No accepted applications yet.</Text>
                <Text color="gray.500">Accepted collaborations will show up here.</Text>
              </Box>
            )}
          </TabPanel>

          {/* REJECTED Tab */}
          <TabPanel>
            {rejectedApplications.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {rejectedApplications.map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text fontSize="xl">No rejected applications.</Text>
              </Box>
            )}
          </TabPanel>

          {/* WITHDRAWN Tab */}
          <TabPanel>
            {withdrawnApplications.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {withdrawnApplications.map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text fontSize="xl">No withdrawn applications.</Text>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Withdraw Application
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to withdraw your application for "{applicationToWithdraw?.order?.title}"?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmWithdraw} ml={3} isLoading={withdrawMutation.isPending}>
                Withdraw
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Box>
  );
};
