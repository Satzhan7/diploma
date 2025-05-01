import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Button,
  Switch,
  useToast,
  Divider,
  Select,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const Settings: React.FC = () => {
  const { logout, deleteAccount } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/users/settings', data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating settings',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      emailNotifications: formData.get('emailNotifications') === 'on',
      pushNotifications: formData.get('pushNotifications') === 'on',
      language: formData.get('language'),
      timezone: formData.get('timezone'),
    };
    updateSettings(data);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteAccount();
        toast({
          title: 'Account deleted',
          description: 'Your account has been successfully deleted.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error: any) {
        toast({
          title: 'Deletion failed',
          description: error.message || 'Could not delete your account.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Settings</Heading>
        
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="md" mb={4}>Notifications</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Email Notifications</FormLabel>
                  <Switch name="emailNotifications" defaultChecked />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Push Notifications</FormLabel>
                  <Switch name="pushNotifications" defaultChecked />
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>Preferences</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Language</FormLabel>
                  <Select name="language" defaultValue="en">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Timezone</FormLabel>
                  <Select name="timezone" defaultValue="UTC">
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="PST">Pacific Time</option>
                    <option value="GMT">GMT</option>
                  </Select>
                </FormControl>
              </VStack>
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isPending}
              loadingText="Saving..."
            >
              Save Changes
            </Button>
          </VStack>
        </form>

        <Button colorScheme="red" onClick={handleDeleteAccount}>
          Delete Account
        </Button>

        <Button onClick={logout}>
          Logout
        </Button>
      </VStack>
    </Container>
  );
}; 