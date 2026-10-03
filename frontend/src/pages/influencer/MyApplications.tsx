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
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../i18n';
import { StatusBadge } from '../../components/ui';

export const MyApplications: React.FC = () => {
  const { t } = useTranslation('influencer');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<Application | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const { data: applications, isLoading, error } = useQuery<Application[], Error>({
    queryKey: ['myApplications', user?.id],
    queryFn: () => applicationsService.getByInfluencer(),
    enabled: !!user,
  });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsService.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications', user?.id] });
      toast({ title: t('applications.toast.withdrawn'), status: 'info' });
      onClose();
      setApplicationToWithdraw(null); // Clear selection after withdrawal
    },
    onError: (err) => {
      toast({ title: t('applications.toast.withdrawError'), description: (err as Error).message, status: 'error' });
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
    navigate(`/influencer/orders/${orderId}`); 
    // console.log('View order:', orderId);
    // toast({ title: 'Order details view not implemented yet.', status: 'warning' });
  };

  const handleViewBrand = (brandUserId: string) => {
    navigate(`/influencer/profile/${brandUserId}`);
  };

  const renderApplicationCard = (application: Application) => (
    <Card key={application.id} variant="outline">
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <Heading size="md" noOfLines={1} title={application.order.title}>
            <ChakraLink as={RouterLink} to={`/influencer/orders/${application.order.id}`} isExternal={false}>
              {application.order.title}
            </ChakraLink>
          </Heading>
          <StatusBadge status={application.status} />
        </HStack>
      </CardHeader>
      <CardBody py={2}>
        <VStack align="start" spacing={1}>
          <Text fontSize="sm">
            {t('applications.card.brand')}
            <ChakraLink ml={1} color="brand.500" onClick={() => application.order.brand?.user?.id && handleViewBrand(application.order.brand.user.id)}>
              {application.order.brand?.displayName || t('shared.brandNameMissing')} <IconWrapper icon={FiExternalLink} />
            </ChakraLink>
          </Text>
          <Text fontSize="sm">{t('applications.card.category', { category: application.order.category })}</Text>
          <Text fontSize="sm">{t('applications.card.appliedOn', { date: formatDate(application.createdAt) })}</Text>
          {application.message && <Text fontSize="sm" mt={2} fontStyle="italic">{t('shared.yourMessage', { message: application.message })}</Text>}
        </VStack>
      </CardBody>
      <CardFooter pt={2}>
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<IconWrapper icon={FiEye} />}
            onClick={() => handleViewOrder(application.order.id)}
            // isDisabled // Enable button
          >
            {t('applications.card.viewOrder')}
          </Button>
          {application.status === 'pending' && (
            <IconButtonWithWrapper
              icon={FiTrash2}
              size="sm"
              colorScheme="red"
              aria-label={t('applications.card.withdraw')}
              onClick={() => handleWithdrawClick(application)}
              isLoading={withdrawMutation.isPending && applicationToWithdraw?.id === application.id}
            />
          )}
        </HStack>
      </CardFooter>
    </Card>
  );

  if (isLoading) return <Center p={10}><Spinner /></Center>;
  if (error) return <Center p={10}><Text color="red.500">{t('applications.loadError', { message: error.message })}</Text></Center>;
  // Now explicitly check if applications is defined *before* rendering tabs
  // This handles the case where the query finishes but returns undefined/null
  if (!applications) return <Center p={10}><Text>{t('applications.empty.all')}</Text></Center>; 


  // Filter applications *once* after loading and error checks
  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');
  const withdrawnApplications = applications.filter(app => app.status === 'withdrawn');

  return (
    <Box p={4}>
      <Heading mb={6}>{t('applications.title')}</Heading>

      <Tabs variant="soft-rounded" colorScheme="brand">
        <TabList mb={4} flexWrap="wrap">
          <Tab>{t('applications.tabs.all', { count: applications.length })}</Tab>
          <Tab>{t('applications.tabs.pending', { count: pendingApplications.length })}</Tab>
          <Tab>{t('applications.tabs.accepted', { count: acceptedApplications.length })}</Tab>
          <Tab>{t('applications.tabs.rejected', { count: rejectedApplications.length })}</Tab>
          <Tab>{t('applications.tabs.withdrawn', { count: withdrawnApplications.length })}</Tab>
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
                <Text fontSize="xl">{t('applications.empty.all')}</Text>
                <Text color="gray.500">{t('applications.empty.allHint')}</Text>
                <Button mt={4} colorScheme="brand" as={RouterLink} to="/influencer/orders">{t('applications.empty.browseOrders')}</Button>
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
                <Text fontSize="xl">{t('applications.empty.pending')}</Text>
                <Text color="gray.500">{t('applications.empty.pendingHint')}</Text>
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
                <Text fontSize="xl">{t('applications.empty.accepted')}</Text>
                <Text color="gray.500">{t('applications.empty.acceptedHint')}</Text>
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
                <Text fontSize="xl">{t('applications.empty.rejected')}</Text>
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
                <Text fontSize="xl">{t('applications.empty.withdrawn')}</Text>
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
              {t('applications.withdrawDialog.title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('applications.withdrawDialog.body', { title: applicationToWithdraw?.order?.title })}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('common:actions.cancel')}
              </Button>
              <Button colorScheme="red" onClick={confirmWithdraw} ml={3} isLoading={withdrawMutation.isPending}>
                {t('applications.withdrawDialog.confirm')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Box>
  );
};
