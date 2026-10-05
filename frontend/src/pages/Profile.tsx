import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Avatar,
  Card,
  CardBody,
  Stack,
  StackDivider,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  HStack,
  Link,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FaInstagram, FaTiktok, FaFacebook, FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { IconWrapper } from '../components/IconWrapper';
import { User, Profile as ProfileType } from '../types/user';
import { formatDate, formatNumber } from '../i18n';
import { getErrorMessage } from '../i18n/errors';

interface ProfileProps {
  isViewMode?: boolean;
}

export const Profile: React.FC<ProfileProps> = ({ isViewMode }) => {
  const { t } = useTranslation('profile');
  const { user, deleteAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  const displayUserId = isViewMode ? userId : user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!displayUserId) return;

      try {
        setLoading(true);
        let response;
        
        if (isViewMode) {
          response = await api.get(`/profiles/${displayUserId}`);
        } else {
          response = await api.get('/profiles/me');
        }
        
        setProfileData(response.data);
        
        if (response.data.user) {
          setTargetUser(response.data.user);
        } else if (!isViewMode && user) {
          setTargetUser(user);
        }

      } catch {
        toast({
          title: t('common:state.error'),
          description: t('view.toast.loadError'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [displayUserId, isViewMode, toast, user, t]);

  const handleCreateChat = async () => {
    // Chats are keyed by user id, never by profile id.
    const chatTargetId = targetUser?.id || (isViewMode ? userId : undefined);
    if (!chatTargetId || !user) return;
    
    try {
      if (chatTargetId === user.id) {
        toast({ title: t('view.toast.chatWithSelf'), status: 'info' });
        return;
      }
      const response = await api.post(`/chats/${chatTargetId}`);
      const chatId = response.data.id;
      
      const messagesRoute = user.role === 'brand' ? '/brand/messages' : '/influencer/messages';
      navigate(messagesRoute, { state: { activeChatId: chatId } });
      
    } catch (error) {
      toast({
        title: t('common:state.error'),
        description: getErrorMessage(error, t('view.toast.chatError')),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      toast({
        title: t('view.toast.accountDeleted.title'),
        description: t('view.toast.accountDeleted.description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: t('common:state.error'),
        description: getErrorMessage(error, t('view.toast.deleteError')),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  const getSocialMediaIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'instagram':
        return <IconWrapper icon={FaInstagram} size="1.25em" color="fg.muted" />;
      case 'tiktok':
        return <IconWrapper icon={FaTiktok} size="1.25em" color="fg.muted" />;
      case 'facebook':
        return <IconWrapper icon={FaFacebook} size="1.25em" color="fg.muted" />;
      case 'twitter':
        return <IconWrapper icon={FaTwitter} size="1.25em" color="fg.muted" />;
      case 'threads':
        return <IconWrapper icon={SiThreads} size="1.25em" color="fg.muted" />;
      case 'linkedin':
        return <IconWrapper icon={FaLinkedin} size="1.25em" color="fg.muted" />;
      default:
        return <IconWrapper icon={FaInstagram} size="1.25em" color="fg.muted" />;
    }
  };

  if (loading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
        <Text mt={4}>{t('view.loading')}</Text>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container centerContent py={10}>
        <Text>{t('view.notFound')}</Text>
      </Container>
    );
  }

  const displayName = profileData?.displayName || targetUser?.name || user?.name || t('view.unknownUser');
  const avatarUrl = profileData?.avatarUrl || targetUser?.avatarUrl || user?.avatarUrl;
  const role = targetUser?.role || user?.role;
  const createdAt = targetUser?.createdAt || user?.createdAt;

  return (
    <Container maxW="container.md" py={{ base: '12', md: '16' }}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Avatar 
            size="2xl" 
            name={displayName}
            src={avatarUrl}
            mb={6} 
          />
          <VStack spacing={3} mt={4}>
            <Heading size="lg">{displayName}</Heading>
            {role && (
              <Text 
                color="fg.muted"
                fontSize="md"
                textTransform="capitalize"
                bg="bg.subtle"
                px={3}
                py={1}
                borderRadius="full"
              >
                {t(`common:role.${role}`, { defaultValue: role })}
              </Text>
            )}
            <Flex direction={{ base: 'column', sm: 'row' }} gap={3} justify="center" mt={4}>
                {!isViewMode && user && (
                    <Button colorScheme="brand" onClick={() => navigate(`/${user.role}/profile/edit`)}>
                        {t('view.editProfile')}
                    </Button>
                )}
                {!isViewMode && user?.role === 'influencer' && (
                    <Button variant="outline" onClick={() => navigate('/influencer/stats')}>
                        {t('common:nav.stats')}
                    </Button>
                )}
                {isViewMode && user?.id !== targetUser?.id && (
                    <Button colorScheme="gray" onClick={handleCreateChat}>
                        {t('view.startChat')}
                    </Button>
                )}
            </Flex>
          </VStack>
        </Box>

        <Card>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={4}>
              {!isViewMode && user && (
                <Box>
                  <Text fontSize="sm" color="fg.subtle">
                    {t('view.fields.email')}
                  </Text>
                  <Text fontSize="md">{user.email}</Text>
                </Box>
              )}
              {role && (
                <Box>
                  <Text fontSize="sm" color="fg.subtle">
                    {t('view.fields.accountType')}
                  </Text>
                  <Text fontSize="md" textTransform="capitalize">
                    {t(`common:role.${role}`, { defaultValue: role })}
                  </Text>
                </Box>
              )}
              {createdAt && (
                <Box>
                  <Text fontSize="sm" color="fg.subtle">
                    {t('view.fields.memberSince')}
                  </Text>
                  <Text fontSize="md">
                    {formatDate(createdAt)}
                  </Text>
                </Box>
              )}
              {profileData.bio && (
                <Box>
                  <Text fontSize="sm" color="fg.subtle">
                    {t('view.fields.bio')}
                  </Text>
                  <Text fontSize="md">{profileData.bio}</Text>
                </Box>
              )}
              {profileData.location && (
                <Box>
                  <Text fontSize="sm" color="fg.subtle">
                    {t('view.fields.location')}
                  </Text>
                  <Text fontSize="md">{profileData.location}</Text>
                </Box>
              )}
              {profileData.websiteUrl && (
                <Box>
                  <Text fontSize="sm" color="fg.subtle">
                    {t('view.fields.website')}
                  </Text>
                  <Link href={profileData.websiteUrl} isExternal color="primary.ink">
                    {profileData.websiteUrl}
                  </Link>
                </Box>
              )}
              {profileData.socialMedia && profileData.socialMedia.length > 0 && (
                <Box>
                  <Text fontSize="sm" color="fg.subtle" mb={2}>
                    {t('view.fields.socialMedia')}
                  </Text>
                  <VStack align="start" spacing={2}>
                    {profileData.socialMedia.map((social) => (
                      <HStack key={social.id}>
                        {getSocialMediaIcon(social.type)}
                        <Link href={social.url} isExternal color="primary.ink">
                          {social.username || social.url}
                        </Link>
                        {social.followers && (
                          <Text fontSize="sm" color="fg.subtle">
                            ({t('view.followers', { count: social.followers, formatted: formatNumber(social.followers) })})
                          </Text>
                        )}
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </Stack>
          </CardBody>
        </Card>

        <HStack spacing={4} justify="center">
          {isViewMode ? (
            <>
              {user && user.id !== (targetUser?.id || userId) && (
                <Button colorScheme="brand" leftIcon={<IconWrapper icon={FaEnvelope} size="1.25em" />} onClick={handleCreateChat}>
                  {t('view.writeMessage')}
                </Button>
              )}
              <Button onClick={() => navigate(-1)}>
                {t('common:actions.back')}
              </Button>
            </>
          ) : (
            <>
              <Button colorScheme="red" variant="outline" onClick={onOpen}>
                {t('view.deleteAccount')}
              </Button>
            </>
          )}
        </HStack>
      </VStack>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('view.deleteDialog.title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('view.deleteDialog.body')}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAccount}
                ml={3}
                isLoading={isDeleting}
              >
                {t('common:actions.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}; 