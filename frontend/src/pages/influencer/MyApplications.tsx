import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Divider,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AiOutlineEye, AiOutlineDelete, AiOutlineCheckCircle } from 'react-icons/ai';
import { BsThreeDotsVertical } from 'react-icons/bs';
import api from '../../services/api';
import { IconButtonWithWrapper, IconWrapper } from '../../components/IconWrapper';
import { applicationsService, Application } from '../../services/applications';
import { Order } from '../../services/orders';

interface MyApplicationData extends Application {
  order: Order;
}

export const MyApplications: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedApplication, setSelectedApplication] = useState<MyApplicationData | null>(null);

  const { data: applications, isLoading, error } = useQuery<MyApplicationData[], Error>({
    queryKey: ['myApplications'],
    queryFn: applicationsService.getMyApplications
  });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsService.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      toast({ title: "Application Withdrawn", status: 'info', duration: 3000, isClosable: true });
      onClose();
      setSelectedApplication(null);
    },
    onError: (err) => {
      toast({ title: "Withdrawal Failed", description: (err as Error).message, status: 'error', duration: 5000, isClosable: true });
    }
  });

  const handleViewDetails = (application: MyApplicationData) => {
    setSelectedApplication(application);
    onOpen();
  };

  const handleWithdrawApplication = () => {
    if (selectedApplication) {
      withdrawMutation.mutate(selectedApplication.id);
    }
  };

  const handleViewBrand = (brandId: string | undefined) => {
    if (brandId) {
      console.log(`Navigate to brand profile: ${brandId}`);
      // Example: navigate(`/profile/user/${brandId}`);
    }
  };

  const renderStatusBadge = (status: string) => {
    let colorScheme = 'gray';
    if (status === 'accepted') colorScheme = 'green';
    if (status === 'pending') colorScheme = 'yellow';
    if (status === 'rejected') colorScheme = 'red';
    if (status === 'withdrawn') colorScheme = 'purple';
    return <Badge colorScheme={colorScheme}>{status}</Badge>;
  };

  if (isLoading) {
    return <Box p={8}>Loading applications...</Box>;
  }

  if (error) {
    return <Box p={8}>Error loading applications</Box>;
  }

  const renderApplicationCard = (application: MyApplicationData) => (
    <Card key={application.id} overflow="hidden" variant="outline">
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md" noOfLines={1}>{application.order.title}</Heading>
          {renderStatusBadge(application.status)}
        </HStack>
        <HStack mt={2} spacing={2}>
          <Badge>{application.order.category}</Badge>
          <Text fontSize="sm" color="gray.500">
            Applied on {new Date(application.createdAt).toLocaleDateString()}
          </Text>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <Text noOfLines={2}>{application.message}</Text>
          <HStack justify="space-between">
            <Text fontWeight="semibold">Brand:</Text>
            <Text>{application.order.brand.name}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontWeight="semibold">Your Proposed Price:</Text>
            <Text>${application.proposedPrice}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontWeight="semibold">Budget:</Text>
            <Text>${application.order.budget}</Text>
          </HStack>
        </VStack>
      </CardBody>
      <CardFooter>
        <Menu>
          <MenuButton
            as={IconButtonWithWrapper}
            icon={BsThreeDotsVertical}
            variant="ghost"
            size="sm"
            aria-label="Actions"
          />
          <MenuList>
            <MenuItem 
              icon={<IconWrapper icon={AiOutlineEye} size="1.25em" />}
              onClick={() => handleViewDetails(application)}
            >
              View Details
            </MenuItem>
            {application.status === 'pending' && (
              <MenuItem
                icon={<IconWrapper icon={AiOutlineDelete} size="1.25em" />}
                onClick={() => handleWithdrawApplication()}
                color="red.500"
              >
                Withdraw Application
              </MenuItem>
            )}
            {application.status === 'accepted' && (
              <MenuItem 
                icon={<IconWrapper icon={AiOutlineCheckCircle} size={20} />}
                onClick={() => navigate(`/influencer/collaborations/${application.order.id}`)}
              >
                Go to Collaboration
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </CardFooter>
    </Card>
  );

  return (
    <Box p={8}>
      <Heading size="lg" mb={6}>My Applications</Heading>

      <Tabs colorScheme="blue" mb={6}>
        <TabList>
          <Tab>All ({applications?.length || 0})</Tab>
          <Tab>Pending ({applications?.filter(app => app.status === 'pending').length || 0})</Tab>
          <Tab>Accepted ({applications?.filter(app => app.status === 'accepted').length || 0})</Tab>
          <Tab>Rejected ({applications?.filter(app => app.status === 'rejected').length || 0})</Tab>
          <Tab>Withdrawn ({applications?.filter(app => app.status === 'withdrawn').length || 0})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {applications && applications.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {applications.map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text mb={4}>You haven't applied to any orders yet.</Text>
                <Button colorScheme="blue" onClick={() => navigate('/influencer/orders')}>
                  Browse Available Orders
                </Button>
              </Box>
            )}
          </TabPanel>
          <TabPanel>
            {applications && applications.filter(app => app.status === 'pending').length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {applications.filter(app => app.status === 'pending').map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text>You don't have any pending applications.</Text>
              </Box>
            )}
          </TabPanel>
          <TabPanel>
            {applications && applications.filter(app => app.status === 'accepted').length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {applications.filter(app => app.status === 'accepted').map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text>You don't have any accepted applications yet.</Text>
              </Box>
            )}
          </TabPanel>
          <TabPanel>
            {applications && applications.filter(app => app.status === 'rejected').length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {applications.filter(app => app.status === 'rejected').map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text>You don't have any rejected applications.</Text>
              </Box>
            )}
          </TabPanel>
          <TabPanel>
            {applications && applications.filter(app => app.status === 'withdrawn').length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {applications.filter(app => app.status === 'withdrawn').map(application => renderApplicationCard(application))}
              </SimpleGrid>
            ) : (
              <Box textAlign="center" p={8}>
                <Text>You don't have any withdrawn applications.</Text>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {selectedApplication && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Application Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                <Box borderWidth="1px" borderRadius="lg" p={4}>
                  <Heading size="md" mb={2}>{selectedApplication.order.title}</Heading>
                  <Text mb={2}>{selectedApplication.order.description}</Text>
                  <Divider my={3} />
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontWeight="bold">Category</Text>
                      <Text>{selectedApplication.order.category}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Budget</Text>
                      <Text>${selectedApplication.order.budget}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Deadline</Text>
                      <Text>{new Date(selectedApplication.order.deadline).toLocaleDateString()}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Status</Text>
                      {renderStatusBadge(selectedApplication.status)}
                    </Box>
                  </SimpleGrid>
                </Box>
                
                <Box borderWidth="1px" borderRadius="lg" p={4}>
                  <Heading size="md" mb={2}>Your Application</Heading>
                  <Text mb={2}>{selectedApplication.message}</Text>
                  <Divider my={3} />
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontWeight="bold">Your Proposed Price</Text>
                      <Text>${selectedApplication.proposedPrice}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Applied On</Text>
                      <Text>{new Date(selectedApplication.createdAt).toLocaleDateString()}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
                
                <Box borderWidth="1px" borderRadius="lg" p={4}>
                  <Heading size="md" mb={2}>Brand Information</Heading>
                  <HStack mb={2}>
                    <Text fontWeight="bold">Brand:</Text>
                    <Text>{selectedApplication.order.brand.name}</Text>
                  </HStack>
                  <Button size="sm" onClick={() => handleViewBrand(selectedApplication.order.brand.id)}>
                    View Brand Profile
                  </Button>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={4}>
                {selectedApplication.status === 'pending' && (
                  <Button 
                    colorScheme="red" 
                    onClick={() => {
                      handleWithdrawApplication();
                      onClose();
                    }}
                  >
                    Withdraw Application
                  </Button>
                )}
                <Button onClick={onClose}>Close</Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}; 