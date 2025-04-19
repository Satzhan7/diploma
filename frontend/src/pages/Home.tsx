import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { FaHandshake, FaChartLine, FaUserCheck } from 'react-icons/fa';

// Simple feature structure with direct JSX
const features = [
  {
    title: 'Connect',
    description: 'Connect brands with influencers seamlessly',
    icon: <FaHandshake size={40} color="#4299E1" style={{ margin: '0 auto' }} />,
  },
  {
    title: 'Grow',
    description: 'Grow your business with targeted collaborations',
    icon: <FaChartLine size={40} color="#4299E1" style={{ margin: '0 auto' }} />,
  },
  {
    title: 'Verify',
    description: 'Work with verified and trusted partners',
    icon: <FaUserCheck size={40} color="#4299E1" style={{ margin: '0 auto' }} />,
  },
];

export const Home: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box bg={bgColor}>
      <Container maxW="container.xl" py={{ base: '20', md: '32' }}>
        <Stack spacing={12}>
          {/* Hero Section */}
          <Stack
            spacing={6}
            textAlign="center"
            align="center"
            maxW="container.md"
            mx="auto"
          >
            <Heading
              as="h1"
              size="3xl"
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
            >
              Connect. Collaborate. Create.
            </Heading>
            <Text fontSize="xl" color="gray.500">
              The ultimate platform connecting brands with influencers for
              impactful collaborations
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              <Button
                as={RouterLink}
                to="/register"
                colorScheme="blue"
                size="lg"
                height="16"
                px="8"
              >
                Get Started
              </Button>
              <Button
                as={RouterLink}
                to="/login"
                variant="outline"
                size="lg"
                height="16"
                px="8"
              >
                Sign In
              </Button>
            </Stack>
          </Stack>

          {/* Features Section */}
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={10}
            px={{ base: 4, md: 0 }}
          >
            {features.map((feature, index) => (
              <Box
                key={index}
                bg={cardBg}
                p={8}
                rounded="lg"
                shadow="md"
                textAlign="center"
              >
                <Flex justify="center" mb={4}>
                  {feature.icon}
                </Flex>
                <Heading size="md" mb={2}>
                  {feature.title}
                </Heading>
                <Text color="gray.500">{feature.description}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}; 