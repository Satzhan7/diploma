import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Badge,
  Spinner,
  Center,
  useToast,
  Heading,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import socketService from '../services/socket';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Conversation, Message } from '../types/chat';
import { User } from '../types/user';
import { formatTime } from '../i18n';
import { getErrorMessage } from '../i18n/errors';

// Helper function to extract user ID safely
const getUserId = (user: User | { id: string } | undefined): string => {
  if (!user) return '';
  return typeof user === 'object' && 'id' in user ? user.id : '';
};

// Helper function to extract chat ID safely
const getChatId = (chat: { id: string } | string | undefined): string => {
  if (!chat) return '';
  if (typeof chat === 'string') return chat;
  return chat.id || '';
};

export const Messages: React.FC = () => {
  const { t } = useTranslation('messages');
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.state && location.state.activeChatId) {
      setSelectedChat(location.state.activeChatId);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedChat) {
      const markAsRead = async () => {
        try {
          await api.post(`/chats/${selectedChat}/read`);
          queryClient.invalidateQueries({ queryKey: ['chats'] });
          queryClient.invalidateQueries({ queryKey: ['messages', selectedChat] });
        } catch (error) {
          console.error('Failed to mark messages as read', error);
        }
      };
      
      markAsRead();
    }
  }, [selectedChat, queryClient]);

  // Effect to connect to socket
  useEffect(() => {
    const connectSocket = async () => {
      try {
        await socketService.connect();
        setIsSocketConnected(true);
      } catch (error) {
        console.error('Failed to connect to socket:', error);
        toast({
          title: t('socketError.title'),
          description: t('socketError.description'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        
        // Try to reconnect after 5 seconds
        setTimeout(connectSocket, 5000);
      }
    };
    
    connectSocket();
    
    return () => {
      socketService.disconnect();
      setIsSocketConnected(false);
    };
  }, [toast, t]);

  // Set up socket listeners
  useEffect(() => {
    if (!isSocketConnected) return;
    
    // Listen for new messages
    socketService.on('newMessage', (message: Message) => {
      console.log('New message received:', message);
      
      // Make sure we have a valid chat ID using our helper
      const messageChatId = getChatId(message.chat);
      
      if (!messageChatId) {
        console.error('Received message without chat ID', message);
        return;
      }
      
      // Update messages for the current chat
      if (selectedChat === messageChatId) {
        queryClient.setQueryData(['messages', selectedChat], (oldData: Message[] | undefined) => {
          if (!oldData) return [message];
          return [...oldData, message];
        });
        
        // Auto scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        // Mark as read if we're the recipient and in this chat
        if (user?.id === getUserId(message.recipient)) {
          api.post(`/chats/${selectedChat}/read`).catch(console.error);
        }
      }
      
      // Update the chat list
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });
    
    // Listen for messages being read
    socketService.on('messagesRead', ({ chatId }: { chatId: string }) => {
      if (selectedChat === chatId) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedChat] });
      }
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });
    
    // Listen for new chat
    socketService.on('newChat', () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });
    
    // Listen for chat updates (like unread count)
    socketService.on('chatUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });
    
    return () => {
      socketService.off('newMessage');
      socketService.off('messagesRead');
      socketService.off('newChat');
      socketService.off('chatUpdated');
    };
  }, [isSocketConnected, selectedChat, user, queryClient]);

  // Join chat room when a chat is selected
  useEffect(() => {
    if (selectedChat && isSocketConnected) {
      socketService.joinChat(selectedChat);
      return () => {
        socketService.leaveChat(selectedChat);
      };
    }
  }, [selectedChat, isSocketConnected]);

  // Scroll to bottom when messages change or a new chat is selected
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat]);

  const { data: chats, isLoading: isLoadingChats, error: chatsError } = useQuery<Conversation[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await api.get('/chats');
      return response.data;
    },
  });

  const { 
    data: messages, 
    isLoading: isLoadingMessages, 
    error: messagesError 
  } = useQuery<Message[]>({
    queryKey: ['messages', selectedChat],
    queryFn: async () => {
      if (!selectedChat) return [];
      const response = await api.get(`/chats/${selectedChat}/messages`);
      return response.data || [];
    },
    enabled: !!selectedChat,
  });

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      setNewMessage('');
      await api.post(`/chats/${selectedChat}/messages`, {
        content: newMessage.trim(),
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChat] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: t('common:state.error'),
        description: getErrorMessage(error, t('sendError')),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Get the other user in the chat (not the current user)
  const getOtherUser = (chat: Conversation): User | null => {
    if (!user || !chat) { 
      return null;
    }
    // Check if the current user is the sender or recipient
    if (chat.sender?.id === user.id) {
      return chat.recipient;
    }
    if (chat.recipient?.id === user.id) {
      return chat.sender;
    }
    // Should not happen in a 1-on-1 chat if data is correct, but return null as fallback
    console.warn('Could not determine other user in chat:', chat);
    return null; 
  };

  if (isLoadingChats) {
    return (
      <Center h="60vh">
        <Spinner size="xl" />
        <Text ml={4}>{t('loadingChats')}</Text>
      </Center>
    );
  }

  if (chatsError) {
    return (
      <Center h="60vh">
        <Text color="danger">{t('chatsLoadError')}</Text>
      </Center>
    );
  }

  return (
    <Box height={{ base: 'calc(100vh - 104px)', lg: 'calc(100vh - 64px)' }}>
      <Grid
        templateColumns={{ base: '1fr', md: '300px 1fr' }}
        templateRows={{ base: selectedChat ? '1fr' : 'auto', md: '1fr' }}
        gap={4}
        height="100%"
      >
        <GridItem
          display={{ base: selectedChat ? 'none' : 'block', md: 'block' }}
          borderWidth="1px"
          borderRadius="lg"
          height="100%"
          overflow="hidden"
          bg="bg.surface"
          boxShadow="sm"
        >
          <VStack spacing={0} align="stretch" height="100%" maxH="100%">
            <Box p={4} borderBottomWidth="1px" bg="bg.surface">
              <Heading size="md">{t('title')}</Heading>
            </Box>
            
            <Box overflowY="auto" height="calc(100% - 60px)">
              {isLoadingChats ? (
                <Center py={10}>
                  <Spinner />
                </Center>
              ) : chatsError ? (
                <Center py={10}>
                  <Text color="danger">{t('conversationsLoadError')}</Text>
                </Center>
              ) : chats && chats.length > 0 ? (
                chats.map((chat) => {
                  const otherUser = getOtherUser(chat);
                  if (!otherUser) {
                    console.warn("Skipping chat render, couldn't get other user for chat:", chat.id);
                    return null;
                  }
                  
                  return (
                    <Box
                      key={chat.id}
                      as="button"
                      type="button"
                      width="100%"
                      textAlign="left"
                      p={3}
                      bg={selectedChat === chat.id ? 'bg.subtle' : 'transparent'}
                      _hover={{ bg: 'bg.subtle' }}
                      _focusVisible={{ boxShadow: 'outline' }}
                      onClick={() => setSelectedChat(chat.id)}
                      borderBottomWidth="1px"
                    >
                      <HStack spacing={3} align="center">
                        <Avatar size="sm" name={otherUser.name || t('unknownUser')} src={otherUser.avatarUrl} />
                        <Box flex="1" overflow="hidden">
                          <HStack justify="space-between">
                            <Text fontWeight="bold" isTruncated>
                              {otherUser.name || t('unknownUser')}
                            </Text>
                            {chat.unreadCount > 0 && (
                              <Badge colorScheme="brand" borderRadius="full" aria-label={t('unread', { count: chat.unreadCount })}>
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </HStack>
                          {chat.lastMessage && (
                            <Text fontSize="sm" color="fg.subtle" isTruncated>
                              {chat.lastMessage.content}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                    </Box>
                  );
                })
              ) : (
                <Center py={10}>
                  <Text color="fg.subtle">{t('noConversations')}</Text>
                </Center>
              )}
            </Box>
          </VStack>
        </GridItem>

        <GridItem
          display={{ base: selectedChat ? 'block' : 'none', md: 'block' }}
          borderWidth="1px"
          borderRadius="lg"
          height="100%"
          overflow="hidden"
        >
          {!selectedChat ? (
            <Center height="100%" bg="bg.surface" borderRadius="lg" boxShadow="sm">
              <VStack spacing={4}>
                <Text color="fg.subtle">{t('selectConversation')}</Text>
                <Text fontSize="sm" color="fg.subtle">{t('or')}</Text>
                <Button colorScheme="brand" size="sm">{t('startNewChat')}</Button>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align="stretch" height="100%">
              <HStack
                p={4}
                borderBottomWidth="1px"
                bg="bg.surface"
                spacing={4}
                align="center"
              >
                <Button
                  display={{ base: 'inline-flex', md: 'none' }}
                  size="sm"
                  onClick={() => setSelectedChat(null)}
                  variant="ghost"
                  leftIcon={<ChevronLeftIcon />}
                >
                  {t('common:actions.back')}
                </Button>
                
                {chats && (
                  (() => {
                    const currentChat = chats.find(c => c.id === selectedChat);
                    const otherUser = currentChat ? getOtherUser(currentChat) : null;
                    return (
                      <>
                        <Avatar
                          size="sm"
                          name={otherUser?.name || t('unknownUser')}
                          src={otherUser?.avatarUrl}
                        />
                        <Text fontWeight="bold">
                          {otherUser?.name || t('unknownUser')}
                        </Text>
                      </>
                    );
                  })()
                )}
              </HStack>

              <Box
                p={4}
                overflowY="auto"
                flex="1"
                display="flex"
                flexDirection="column"
                height="calc(100% - 140px)"
                bg="bg.surface"
              >
                {isLoadingMessages ? (
                  <Center flex="1">
                    <Spinner />
                  </Center>
                ) : messagesError ? (
                  <Center flex="1">
                    <Text color="danger">{t('messagesLoadError')}</Text>
                  </Center>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => {
                    const isMyMessage = user?.id === getUserId(message.sender);
                    return (
                      <Box
                        key={message.id}
                        alignSelf={isMyMessage ? 'flex-end' : 'flex-start'}
                        maxWidth={{ base: "85%", md: "70%" }}
                        mb={3}
                      >
                        <Box
                          bg={isMyMessage ? 'primary' : 'bg.surface'}
                          color={isMyMessage ? 'primary.fg' : 'fg.default'}
                          p={3}
                          borderRadius="lg"
                          boxShadow="sm"
                        >
                          <Text>{message.content}</Text>
                        </Box>
                        <Text fontSize="xs" color="fg.subtle" textAlign={isMyMessage ? 'right' : 'left'}>
                          {formatTime(message.createdAt)}
                          {isMyMessage && (
                            <Text as="span" ml={1}>
                              {message.isRead ? ' ✓✓' : ' ✓'}
                            </Text>
                          )}
                        </Text>
                      </Box>
                    );
                  })
                ) : (
                  <Center flex="1">
                    <Text color="fg.subtle">{t('noMessages')}</Text>
                  </Center>
                )}
                <div ref={messagesEndRef} />
              </Box>

              <HStack
                p={4}
                borderTopWidth="1px"
                bg="bg.surface"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('inputPlaceholder')}
                  borderRadius="full"
                  bg="bg.subtle"
                  _focus={{ bg: 'bg.surface', borderColor: 'primary' }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  colorScheme="brand"
                  onClick={handleSendMessage}
                  isDisabled={!newMessage.trim()}
                  borderRadius="full"
                >
                  {t('common:actions.send')}
                </Button>
              </HStack>
            </VStack>
          )}
        </GridItem>
      </Grid>
    </Box>
  );
};

export default Messages; 