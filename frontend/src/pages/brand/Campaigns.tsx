import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface Campaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  requirements: string;
  influencersCount: number;
  totalReach: number;
}

interface CampaignFormData {
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  requirements: string;
}

function Campaigns() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    budget: 0,
    startDate: '',
    endDate: '',
    requirements: '',
  });

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await api.get('/campaigns');
      return response.data;
    },
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: (data: CampaignFormData) => api.post('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onClose();
      toast({
        title: 'Campaign created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create campaign',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign.mutate(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) : value,
    }));
  };

  return (
    <Box>
      <Stack direction="row" align="center" justify="space-between" mb={6}>
        <Heading size="lg">Campaigns</Heading>
        <Button colorScheme="blue" onClick={onOpen}>
          Create Campaign
        </Button>
      </Stack>

      {isLoading ? (
        <Text>Loading campaigns...</Text>
      ) : campaigns?.length ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {campaigns.map((campaign: Campaign) => (
            <Box
              key={campaign.id}
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="lg"
            >
              <Stack spacing={4}>
                <Box>
                  <Heading size="md">{campaign.name}</Heading>
                  <Text color="gray.600">
                    Status: {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Text>
                </Box>

                <Text noOfLines={3}>{campaign.description}</Text>

                <Box>
                  <Text fontWeight="bold">Budget:</Text>
                  <Text>${campaign.budget.toLocaleString()}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Duration:</Text>
                  <Text>
                    {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Influencers:</Text>
                  <Text>{campaign.influencersCount}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Total Reach:</Text>
                  <Text>{campaign.totalReach.toLocaleString()}</Text>
                </Box>

                <Button
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => {/* Handle view details */}}
                >
                  View Details
                </Button>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Text>No campaigns found. Create your first campaign!</Text>
      )}

      {/* Create Campaign Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Create Campaign</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Campaign Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Budget (USD)</FormLabel>
                  <Input
                    name="budget"
                    type="number"
                    value={formData.budget}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Requirements</FormLabel>
                  <Textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    placeholder="Describe what you expect from influencers..."
                  />
                </FormControl>
              </Stack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={createCampaign.isPending}
              >
                Create
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Campaigns; 