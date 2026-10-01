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

const SETTINGS_STORAGE_KEY = 'adpartners.userSettings';

interface LocalSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timezone: string;
}

const DEFAULT_SETTINGS: LocalSettings = {
  emailNotifications: true,
  pushNotifications: true,
  language: 'en',
  timezone: 'UTC',
};

const loadSettings = (): LocalSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const Settings: React.FC = () => {
  const { logout, deleteAccount } = useAuth();
  const toast = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const initialSettings = React.useMemo(loadSettings, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data: LocalSettings = {
      emailNotifications: formData.get('emailNotifications') === 'on',
      pushNotifications: formData.get('pushNotifications') === 'on',
      language: String(formData.get('language') ?? 'en'),
      timezone: String(formData.get('timezone') ?? 'UTC'),
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
      toast({
        title: 'Preferences saved',
        description: 'Stored locally on this device.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Could not save preferences',
        description: error?.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
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
                  <Switch name="emailNotifications" defaultChecked={initialSettings.emailNotifications} />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Push Notifications</FormLabel>
                  <Switch name="pushNotifications" defaultChecked={initialSettings.pushNotifications} />
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>Preferences</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Language</FormLabel>
                  <Select name="language" defaultValue={initialSettings.language}>
                    <option value="en">English</option>
                    <option value="ru">Russian</option>
                    <option value="kk">Kazakh</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Timezone</FormLabel>
                  <Select name="timezone" defaultValue={initialSettings.timezone}>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Almaty">Asia/Almaty</option>
                    <option value="Asia/Astana">Asia/Astana</option>
                    <option value="Europe/Moscow">Europe/Moscow</option>
                  </Select>
                </FormControl>
              </VStack>
            </Box>

            <Button
              type="submit"
              colorScheme="brand"
              isLoading={isSaving}
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