import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useColorModeValue,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box
      bg={bgColor}
      borderBottom={1}
      borderStyle="solid"
      borderColor={borderColor}
      position="fixed"
      width="100%"
      zIndex={10}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <RouterLink to="/">
            <Text fontSize="xl" fontWeight="bold">
              Influencer Platform
            </Text>
          </RouterLink>

          <Flex alignItems="center">
            {!user ? (
              <Stack direction="row" spacing={4}>
                <Button as={RouterLink} to="/login" variant="ghost">
                  Login
                </Button>
                <Button as={RouterLink} to="/register" colorScheme="blue">
                  Register
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={4} alignItems="center">
                {user.role === 'brand' && (
                  <Button
                    as={RouterLink}
                    to="/dashboard/brand/create-order"
                    colorScheme="blue"
                    size="sm"
                  >
                    Create Order
                  </Button>
                )}
                <Menu>
                  <MenuButton>
                    <Avatar size="sm" name={user.name} />
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to={`/dashboard/${user.role}`}>
                      Dashboard
                    </MenuItem>
                    <MenuItem as={RouterLink} to="/profile">
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </MenuList>
                </Menu>
              </Stack>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}; 