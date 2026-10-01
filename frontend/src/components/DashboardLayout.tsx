import React from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Link,
  Avatar,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Divider,
  Tooltip,
  useDisclosure,
  useColorMode,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { IconType } from 'react-icons';
import {
  FiHome,
  FiList,
  FiMessageSquare,
  FiSettings,
  FiUsers,
  FiAward,
  FiUser,
  FiMenu,
  FiLogOut,
  FiMoon,
  FiSun,
  FiFilePlus,
  FiZap,
} from 'react-icons/fi';
import { UserRole } from '../types/user';
import { useAuth } from '../contexts/AuthContext';
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

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const BOTH = [UserRole.BRAND, UserRole.INFLUENCER];

// Grouped IA — see docs/PRODUCT_STRUCTURE.md.
const navGroups: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', icon: FiHome, pathSuffix: 'dashboard', roles: BOTH }],
  },
  {
    label: 'Work',
    items: [
      { label: 'Orders', icon: FiList, pathSuffix: 'orders', roles: BOTH },
      { label: 'Create Order', icon: FiFilePlus, pathSuffix: 'orders/create', roles: [UserRole.BRAND] },
      { label: 'My Applications', icon: FiAward, pathSuffix: 'applications', roles: [UserRole.INFLUENCER] },
      { label: 'Matches', icon: FiAward, pathSuffix: 'matches', roles: BOTH },
    ],
  },
  {
    label: 'Discover',
    items: [
      { label: 'Influencers', icon: FiUsers, pathSuffix: 'influencers', roles: [UserRole.BRAND] },
      { label: 'Brands', icon: FiUsers, pathSuffix: 'brands', roles: [UserRole.INFLUENCER] },
      { label: 'Recommendations', icon: FiZap, pathSuffix: 'recommendations', roles: [UserRole.INFLUENCER] },
    ],
  },
  {
    label: 'Communication',
    items: [{ label: 'Messages', icon: FiMessageSquare, pathSuffix: 'messages', roles: BOTH }],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', icon: FiUser, pathSuffix: 'profile', roles: BOTH },
      { label: 'Settings', icon: FiSettings, pathSuffix: 'settings', roles: BOTH },
    ],
  },
];

const SIDEBAR_WIDTH = '260px';

interface SidebarContentProps {
  role?: UserRole;
  onNavigate?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ role, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  const basePath = role === UserRole.BRAND ? '/brand' : role === UserRole.INFLUENCER ? '/influencer' : '/';

  // Longest-prefix match so "Orders" doesn't stay active on /orders/create.
  const allPaths = navGroups
    .flatMap((g) => g.items)
    .filter((item) => role && item.roles.includes(role))
    .map((item) => `${basePath}/${item.pathSuffix}`);
  const activePath = allPaths
    .filter((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Flex direction="column" h="full">
      <Box py={5} px={4}>
        <Logo />
      </Box>

      <VStack as="nav" aria-label="Main navigation" spacing={5} align="stretch" px={3} flex={1} overflowY="auto">
        {navGroups.map((group, groupIndex) => {
          const items = group.items.filter((item) => role && item.roles.includes(role));
          if (items.length === 0) return null;

          return (
            <Box key={group.label ?? groupIndex}>
              {group.label && (
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  color="fg.subtle"
                  px={3}
                  mb={2}
                >
                  {group.label}
                </Text>
              )}
              <VStack spacing={1} align="stretch">
                {items.map((item) => {
                  const fullPath = `${basePath}/${item.pathSuffix}`;
                  const isActive = fullPath === activePath;

                  return (
                    <Link
                      key={item.pathSuffix}
                      as={RouterLink}
                      to={fullPath}
                      onClick={onNavigate}
                      display="flex"
                      alignItems="center"
                      minH="44px"
                      px={3}
                      py={2}
                      borderRadius="md"
                      fontSize="sm"
                      fontWeight={isActive ? '600' : '500'}
                      bg={isActive ? 'bg.subtle' : 'transparent'}
                      color={isActive ? 'accent.solid' : 'fg.muted'}
                      transition="background 120ms ease-out, color 120ms ease-out"
                      _hover={{ bg: 'bg.subtle', color: 'fg.default', textDecoration: 'none' }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <IconWrapper icon={item.icon} size="1.25em" />
                      <Text ml={3}>{item.label}</Text>
                    </Link>
                  );
                })}
              </VStack>
            </Box>
          );
        })}
      </VStack>

      <Box px={3} py={4}>
        <Divider mb={4} borderColor="border.default" />
        <HStack spacing={3}>
          <Avatar size="sm" name={user?.name} />
          <Box flex={1} minW={0}>
            <Text fontSize="sm" fontWeight="600" noOfLines={1}>
              {user?.name}
            </Text>
            <Text fontSize="xs" color="fg.subtle" noOfLines={1}>
              {user?.email}
            </Text>
          </Box>
          <Tooltip label={colorMode === 'light' ? 'Dark mode' : 'Light mode'}>
            <IconButton
              aria-label={colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              icon={<IconWrapper icon={colorMode === 'light' ? FiMoon : FiSun} size="1em" />}
              size="sm"
              variant="ghost"
              colorScheme="gray"
              onClick={toggleColorMode}
            />
          </Tooltip>
          <Tooltip label="Log out">
            <IconButton
              aria-label="Log out"
              icon={<IconWrapper icon={FiLogOut} size="1em" />}
              size="sm"
              variant="ghost"
              colorScheme="gray"
              onClick={handleLogout}
            />
          </Tooltip>
        </HStack>
      </Box>
    </Flex>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex minH="100vh" bg="bg.canvas">
      {/* Desktop sidebar */}
      <Box
        display={{ base: 'none', lg: 'block' }}
        w={SIDEBAR_WIDTH}
        bg="bg.surface"
        borderRight="1px"
        borderColor="border.default"
        position="fixed"
        h="100vh"
        zIndex="sticky"
      >
        <SidebarContent role={role} />
      </Box>

      {/* Mobile top bar */}
      <Flex
        display={{ base: 'flex', lg: 'none' }}
        position="fixed"
        top={0}
        left={0}
        right={0}
        h="56px"
        align="center"
        px={4}
        gap={3}
        bg="bg.surface"
        borderBottom="1px"
        borderColor="border.default"
        zIndex="sticky"
      >
        <IconButton
          aria-label="Open navigation menu"
          icon={<IconWrapper icon={FiMenu} size="1.25em" />}
          variant="ghost"
          colorScheme="gray"
          onClick={onOpen}
        />
        <Logo />
      </Flex>

      {/* Mobile drawer nav */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW={SIDEBAR_WIDTH}>
          <DrawerCloseButton zIndex={1} />
          <SidebarContent role={role} onNavigate={onClose} />
        </DrawerContent>
      </Drawer>

      <Box
        as="main"
        ml={{ base: 0, lg: SIDEBAR_WIDTH }}
        pt={{ base: '72px', lg: 8 }}
        px={{ base: 4, md: 8 }}
        pb={8}
        flex={1}
        minW={0}
      >
        {children}
      </Box>
    </Flex>
  );
};

export default DashboardLayout;
