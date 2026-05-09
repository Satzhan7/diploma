import React from 'react';
import { Box, Flex, Text, VStack, useColorModeValue, Link } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { IconType } from 'react-icons';
import { FiHome, FiList, FiMessageSquare, FiSettings, FiUsers, FiAward, FiUser } from 'react-icons/fi';
import { BsFileEarmarkPlus, BsLightbulb } from 'react-icons/bs';
import { UserRole } from '../types/user';
import { IconWrapper } from './IconWrapper';
import Logo from './Logo';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: UserRole;
}

interface NavItem {
  label: string;
  icon: IconType;
  pathSuffix: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: FiHome, pathSuffix: 'dashboard', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
  { label: 'Profile', icon: FiUser, pathSuffix: 'profile', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
  { label: 'Orders', icon: FiList, pathSuffix: 'orders', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
  { label: 'Create Order', icon: BsFileEarmarkPlus, pathSuffix: 'orders/create', roles: [UserRole.BRAND] },
  { label: 'My Applications', icon: FiAward, pathSuffix: 'applications', roles: [UserRole.INFLUENCER] },
  { label: 'Influencers', icon: FiUsers, pathSuffix: 'influencers', roles: [UserRole.BRAND] },
  { label: 'Brands', icon: FiUsers, pathSuffix: 'brands', roles: [UserRole.INFLUENCER] },
  { label: 'Recommendations', icon: BsLightbulb, pathSuffix: 'recommendations', roles: [UserRole.INFLUENCER] },
  { label: 'Messages', icon: FiMessageSquare, pathSuffix: 'messages', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
  { label: 'Matches', icon: FiAward, pathSuffix: 'matches', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
  { label: 'Settings', icon: FiSettings, pathSuffix: 'settings', roles: [UserRole.BRAND, UserRole.INFLUENCER] },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const location = useLocation();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('gray.100', 'gray.700');

  const basePath = role === UserRole.BRAND ? '/brand' : role === UserRole.INFLUENCER ? '/influencer' : '/';

  const filteredNavItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <Flex minH="100vh">
      <Box
        as="nav"
        w="250px"
        bg={bg}
        borderRight="1px"
        borderColor={borderColor}
        position="fixed"
        h="100vh"
        overflowY="auto"
      >
        <Box py={5} px={4} mb={4}> 
          <Logo />
        </Box>
        
        <VStack spacing={1} align="stretch" px={2}>
          {filteredNavItems.map((item) => {
            const fullPath = `${basePath}/${item.pathSuffix}`;
            const isActive = location.pathname.startsWith(fullPath);
            
            return (
              <Link
                key={item.pathSuffix}
                as={RouterLink}
                to={fullPath}
                display="flex"
                alignItems="center"
                px={4}
                py={3}
                bg={isActive ? activeBg : 'transparent'}
                _hover={{ bg: activeBg, textDecoration: 'none' }}
                borderRadius="md"
                fontWeight={isActive ? 'bold' : 'normal'}
                color={isActive ? 'blue.500' : 'inherit'}
              >
                <Flex alignItems="center">
                  {item.icon && (
                     <IconWrapper 
                        icon={item.icon} 
                      />
                  )}
                  <Text ml={3}>{item.label}</Text>
                </Flex>
              </Link>
            );
          })}
        </VStack>
      </Box>
      <Box ml="250px" p={8} flex={1} as="main">
        {children}
      </Box>
    </Flex>
  );
};

export default DashboardLayout; 