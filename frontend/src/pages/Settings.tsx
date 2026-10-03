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
  Text,
  useToast,
  Divider,
  Select,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getErrorMessage } from '../i18n/errors';

const SETTINGS_STORAGE_KEY = 'adpartners.userSettings';

// The UI language is not part of these settings: LanguageSwitcher stores it
// under its own key (see i18n/index.ts).
interface LocalSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;
}

const DEFAULT_SETTINGS: LocalSettings = {
  emailNotifications: true,
  pushNotifications: true,
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
  const { t } = useTranslation('settings');
  const { logout, deleteAccount } = useAuth();
  const toast = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const initialSettings = React.useMemo(loadSettings, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.target as HTMLFormElement);
    // Chakra's Switch submits an empty value when on, so check presence.
    const data: LocalSettings = {
      emailNotifications: formData.has('emailNotifications'),
      pushNotifications: formData.has('pushNotifications'),
      timezone: String(formData.get('timezone') ?? 'UTC'),
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
      toast({
        title: t('toast.saved.title'),
        description: t('toast.saved.description'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t('toast.saveFailed'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        await deleteAccount();
        toast({
          title: t('toast.deleted.title'),
          description: t('toast.deleted.description'),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: t('toast.deleteFailed'),
          description: getErrorMessage(error),
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
        <Heading size="lg">{t('title')}</Heading>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="md" mb={4}>{t('notifications.title')}</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">{t('notifications.email')}</FormLabel>
                  <Switch name="emailNotifications" defaultChecked={initialSettings.emailNotifications} />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">{t('notifications.push')}</FormLabel>
                  <Switch name="pushNotifications" defaultChecked={initialSettings.pushNotifications} />
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>{t('preferences.title')}</Heading>
              <VStack spacing={4} align="stretch">
                {/* Applies immediately; not saved with the form. */}
                <Box>
                  <Text fontWeight="medium" mb={2}>{t('common:language.label')}</Text>
                  <LanguageSwitcher size="sm" />
                </Box>
                <FormControl>
                  <FormLabel>{t('preferences.timezone')}</FormLabel>
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
              loadingText={t('saving')}
            >
              {t('save')}
            </Button>
          </VStack>
        </form>

        <Button colorScheme="red" onClick={handleDeleteAccount}>
          {t('deleteAccount')}
        </Button>

        <Button onClick={logout}>
          {t('common:actions.logout')}
        </Button>
      </VStack>
    </Container>
  );
};
