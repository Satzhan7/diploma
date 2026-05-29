import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Input,
  useToast,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService, Match, UpdateMatchStatsDto } from '../services/matching';

interface UpdateStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentStats?: Match['stats'];
}

export const UpdateStatsModal: React.FC<UpdateStatsModalProps> = ({ 
  isOpen, 
  onClose, 
  matchId, 
  currentStats 
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateMatchStatsDto>({
    clicks: currentStats?.clicks ?? 0,
    impressions: currentStats?.impressions ?? 0,
    engagementRate: currentStats?.engagementRate ?? 0,
    followerGrowth: currentStats?.followerGrowth ?? 0,
  });

  // Update form when currentStats change (e.g., modal reused)
  useEffect(() => {
    setFormData({
      clicks: currentStats?.clicks ?? 0,
      impressions: currentStats?.impressions ?? 0,
      engagementRate: currentStats?.engagementRate ?? 0,
      followerGrowth: currentStats?.followerGrowth ?? 0,
    });
  }, [currentStats]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : Number(value) // Handle empty input, allow undefined stats
    }));
  };

  const mutation = useMutation({
    mutationFn: (data: UpdateMatchStatsDto) => 
      matchingService.updateMatchStats(matchId, data),
    onSuccess: () => {
      toast({ title: 'Stats Updated', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['match', matchId] }); // Refresh match details
      queryClient.invalidateQueries({ queryKey: ['userMatches'] }); // Refresh matches list if needed
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating stats', 
        description: error.response?.data?.message || error.message, 
        status: 'error' 
      });
    }
  });

  const handleSubmit = () => {
    mutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Match Statistics</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Clicks</FormLabel>
              <Input
                name="clicks"
                type="number"
                placeholder="Enter number of clicks"
                value={formData.clicks ?? ''} // Handle undefined for input value
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Impressions</FormLabel>
              <Input
                name="impressions"
                type="number"
                placeholder="Enter number of impressions"
                value={formData.impressions ?? ''}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Engagement Rate (%)</FormLabel>
              <Input
                name="engagementRate"
                type="number"
                step="0.1"
                placeholder="Enter engagement rate"
                value={formData.engagementRate ?? ''}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Follower Growth</FormLabel>
              <Input
                name="followerGrowth"
                type="number"
                placeholder="Enter follower growth"
                value={formData.followerGrowth ?? ''}
                onChange={handleInputChange}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={mutation.isPending}
          >
            Save Stats
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateStatsModal; 