import React from 'react';
import { Box, Flex, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { IconType } from 'react-icons';
import { FiHome, FiList, FiMessageSquare, FiSettings, FiUsers } from 'react-icons/fi';
import { BsFileEarmarkPlus } from 'react-icons/bs';
import { UserRole } from '../types/user';
import { useAuth } from '../contexts/AuthContext';
import { IconWrapper } from './IconWrapper';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: UserRole;
}

interface NavItem {
  label: string;
  icon: IconType;
  to: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: FiHome, to: '/dashboard', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
  { label: 'My Orders', icon: FiList, to: '/orders', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
  { label: 'Create Order', icon: BsFileEarmarkPlus, to: '/orders/create', roles: [UserRole.BRAND] },
  { label: 'Available Orders', icon: FiList, to: '/orders/available', roles: [UserRole.INFLUENCER] },
  { label: 'My Applications', icon: FiList, to: '/applications', roles: [UserRole.INFLUENCER] },
  { label: 'Messages', icon: FiMessageSquare, to: '/chats', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
  { label: 'Influencers', icon: FiUsers, to: '/influencers', roles: [UserRole.BRAND] },
  { label: 'Brands', icon: FiUsers, to: '/brands', roles: [UserRole.INFLUENCER] },
  { label: 'Settings', icon: FiSettings, to: '/settings', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const location = useLocation();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('gray.100', 'gray.700');

  const filteredNavItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <Flex minH="100vh">
      <Box
        w="250px"
        bg={bg}
        borderRight="1px"
        borderColor={borderColor}
        py={5}
        position="fixed"
        h="100vh"
        overflowY="auto"
      >
        <VStack spacing={1} align="stretch">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            
            return (
              <Box
                key={item.to}
                as={RouterLink}
                to={item.to}
                px={4}
                py={3}
                display="flex"
                alignItems="center"
                bg={isActive ? activeBg : 'transparent'}
                _hover={{ bg: activeBg }}
                borderRadius="md"
                mx={2}
              >
                <Flex alignItems="center">
                  <Box
                    as="span"
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="center"
                    mr={3}
                  >
                    {item.icon && <IconWrapper icon={item.icon} size="1.25em" />}
                  </Box>
                  <Text>{item.label}</Text>
                </Flex>
              </Box>
            );
          })}
        </VStack>
      </Box>
      <Box ml="250px" p={8} flex={1}>
        {children}
      </Box>
    </Flex>
  );
};

export default DashboardLayout; 