import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FaInstagram, FaTiktok, FaFacebook, FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { IconWrapper } from '../components/IconWrapper';
import { User, Profile as ProfileType } from '../types/user';

interface ProfileProps {
  isViewMode?: boolean;
}

export const Profile: React.FC<ProfileProps> = ({ isViewMode }) => {
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

      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [displayUserId, isViewMode, toast, user]);

  const handleCreateChat = async () => {
    const chatTargetId = targetUser?.id || profileData?.id;
    if (!chatTargetId || !user) return;
    
    try {
      if (chatTargetId === user.id) {
        toast({ title: 'Cannot chat with yourself', status: 'info' });
        return;
      }
      const response = await api.post(`/chats/user/${chatTargetId}`); 
      const chatId = response.data.id;
      
      navigate(`/messages`, { state: { activeChatId: chatId } });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create or open chat.',
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
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete your account. Please try again.',
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
        return <IconWrapper icon={FaInstagram} size="1.25em" color="gray.600" />;
      case 'tiktok':
        return <IconWrapper icon={FaTiktok} size="1.25em" color="gray.600" />;
      case 'facebook':
        return <IconWrapper icon={FaFacebook} size="1.25em" color="gray.600" />;
      case 'twitter':
        return <IconWrapper icon={FaTwitter} size="1.25em" color="gray.600" />;
      case 'threads':
        return <IconWrapper icon={SiThreads} size="1.25em" color="gray.600" />;
      case 'linkedin':
        return <IconWrapper icon={FaLinkedin} size="1.25em" color="gray.600" />;
      default:
        return <IconWrapper icon={FaInstagram} size="1.25em" color="gray.600" />;
    }
  };

  if (loading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading profile...</Text>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container centerContent py={10}>
        <Text>Profile not found or could not be loaded.</Text>
      </Container>
    );
  }

  const displayName = profileData?.displayName || targetUser?.name || user?.name || 'User';
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
          <VStack spacing={3}>
            <Heading size="lg">{displayName}</Heading>
            {role && (
              <Text 
                color="gray.500" 
                fontSize="md" 
                textTransform="capitalize"
                bg="gray.100"
                px={3}
                py={1}
                borderRadius="full"
              >
                {role}
              </Text>
            )}
          </VStack>
        </Box>

        <Card>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={4}>
              {!isViewMode && user && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Email
                  </Text>
                  <Text fontSize="md">{user.email}</Text>
                </Box>
              )}
              {role && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Account Type
                  </Text>
                  <Text fontSize="md" textTransform="capitalize">
                    {role}
                  </Text>
                </Box>
              )}
              {createdAt && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Member Since
                  </Text>
                  <Text fontSize="md">
                    {new Date(createdAt).toLocaleDateString()}
                  </Text>
                </Box>
              )}
              {profileData.bio && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Bio
                  </Text>
                  <Text fontSize="md">{profileData.bio}</Text>
                </Box>
              )}
              {profileData.location && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Location
                  </Text>
                  <Text fontSize="md">{profileData.location}</Text>
                </Box>
              )}
              {profileData.websiteUrl && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Website
                  </Text>
                  <Link href={profileData.websiteUrl} isExternal color="blue.500">
                    {profileData.websiteUrl}
                  </Link>
                </Box>
              )}
              {profileData.socialMedia && profileData.socialMedia.length > 0 && (
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Social Media
                  </Text>
                  <VStack align="start" spacing={2}>
                    {profileData.socialMedia.map((social) => (
                      <HStack key={social.id}>
                        {getSocialMediaIcon(social.type)}
                        <Link href={social.url} isExternal color="blue.500">
                          {social.username || social.url}
                        </Link>
                        {social.followers && (
                          <Text fontSize="sm" color="gray.500">
                            ({social.followers.toLocaleString()} followers)
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
              {user && user.id !== (targetUser?.id || profileData?.id) && (
                <Button colorScheme="blue" leftIcon={<IconWrapper icon={FaEnvelope} size="1.25em" />} onClick={handleCreateChat}>
                  Write Message
                </Button>
              )}
              <Button onClick={() => navigate(-1)}>
                Back
              </Button>
            </>
          ) : (
            <>
              <Button colorScheme="blue" onClick={() => navigate('/profile/edit')}>
                Edit Profile
              </Button>
              <Button colorScheme="red" variant="outline" onClick={onOpen}>
                Delete Account
              </Button>
            </>
          )}
        </HStack>
      </VStack>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You can't undo this action afterwards. All your data will be permanently
              removed.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAccount}
                ml={3}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}; 