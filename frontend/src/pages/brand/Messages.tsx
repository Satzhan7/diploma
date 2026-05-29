import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Input,
  Button,
  Text,
  VStack,
  Avatar,
  Heading,
  Divider,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount: number;
}

function Messages() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { colorMode } = useColorMode();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then((res) => res.data),
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['messages', selectedContact?.id],
    queryFn: () =>
      selectedContact
        ? api.get(`/messages/${selectedContact.id}`).then((res) => res.data)
        : Promise.resolve([]),
    enabled: !!selectedContact,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedContact) throw new Error('No contact selected');
      return api.post('/messages', {
        content,
        receiverId: selectedContact.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedContact?.id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setMessageInput('');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessageMutation.mutate(messageInput.trim());
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Flex h="calc(100vh - 100px)" overflow="hidden">
      <Box
        w="300px"
        borderRight="1px"
        borderColor={borderColor}
        overflowY="auto"
        bg={bgColor}
      >
        <Heading size="md" p={4}>Messages</Heading>
        <Divider />
        <VStack spacing="4" align="stretch">
          {contacts?.map((contact: Contact) => (
            <Box
              key={contact.id}
              p={4}
              cursor="pointer"
              bg={selectedContact?.id === contact.id ? 'blue.50' : 'transparent'}
              _hover={{ bg: 'gray.50' }}
              onClick={() => setSelectedContact(contact)}
            >
              <Flex align="center">
                <Avatar size="sm" name={contact.name} src={contact.avatar} />
                <Box ml={3} flex={1}>
                  <Text fontWeight="bold">{contact.name}</Text>
                  <Text fontSize="sm" color="gray.500" noOfLines={1}>
                    {contact.lastMessage}
                  </Text>
                </Box>
                {contact.unreadCount > 0 && (
                  <Box
                    bg="blue.500"
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                  >
                    {contact.unreadCount}
                  </Box>
                )}
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>

      <Flex flex={1} direction="column">
        {selectedContact ? (
          <>
            <Flex
              p={4}
              borderBottom="1px"
              borderColor={borderColor}
              align="center"
              bg={bgColor}
            >
              <Avatar size="sm" name={selectedContact.name} src={selectedContact.avatar} />
              <Text fontWeight="bold" ml={3}>
                {selectedContact.name}
              </Text>
            </Flex>

            <Box flex={1} overflowY="auto" p={4}>
              {messages?.map((message) => (
                <Box
                  key={message.id}
                  mb={4}
                  display="flex"
                  justifyContent={
                    message.senderId === selectedContact.id ? 'flex-start' : 'flex-end'
                  }
                >
                  <Box
                    maxW="70%"
                    bg={
                      message.senderId === selectedContact.id
                        ? 'gray.100'
                        : 'blue.500'
                    }
                    color={
                      message.senderId === selectedContact.id
                        ? 'black'
                        : 'white'
                    }
                    p={3}
                    borderRadius="lg"
                  >
                    <Text>{message.content}</Text>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            <Box p={4} borderTop="1px" borderColor={borderColor}>
              <form onSubmit={handleSendMessage}>
                <Flex>
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    mr={2}
                  />
                  <Button
                    colorScheme="blue"
                    type="submit"
                    isLoading={sendMessageMutation.isPending}
                  >
                    Send
                  </Button>
                </Flex>
              </form>
            </Box>
          </>
        ) : (
          <Flex
            flex={1}
            align="center"
            justify="center"
            direction="column"
            color="gray.500"
          >
            <Text fontSize="lg">Select a contact to start messaging</Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default Messages; 