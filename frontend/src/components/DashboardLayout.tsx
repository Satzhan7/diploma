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
import { useTranslation } from 'react-i18next';
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
import LanguageSwitcher from './LanguageSwitcher';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: UserRole;
}

interface NavItem {
  /** Key in the common namespace. */
  label: string;
  icon: IconType;
  pathSuffix: string;
  roles: UserRole[];
}

interface NavGroup {
  /** Key in the common namespace. */
  label?: string;
  items: NavItem[];
}

const BOTH = [UserRole.BRAND, UserRole.INFLUENCER];

// Grouped IA — see docs/PRODUCT_STRUCTURE.md.
const navGroups: NavGroup[] = [
  {
    items: [{ label: 'nav.dashboard', icon: FiHome, pathSuffix: 'dashboard', roles: BOTH }],
  },
  {
    label: 'nav.groups.work',
    items: [
      { label: 'nav.orders', icon: FiList, pathSuffix: 'orders', roles: BOTH },
      { label: 'nav.createOrder', icon: FiFilePlus, pathSuffix: 'orders/create', roles: [UserRole.BRAND] },
      { label: 'nav.myApplications', icon: FiAward, pathSuffix: 'applications', roles: [UserRole.INFLUENCER] },
      { label: 'nav.matches', icon: FiAward, pathSuffix: 'matches', roles: BOTH },
    ],
  },
  {
    label: 'nav.groups.discover',
    items: [
      { label: 'nav.influencers', icon: FiUsers, pathSuffix: 'influencers', roles: [UserRole.BRAND] },
      { label: 'nav.brands', icon: FiUsers, pathSuffix: 'brands', roles: [UserRole.INFLUENCER] },
      { label: 'nav.recommendations', icon: FiZap, pathSuffix: 'recommendations', roles: [UserRole.INFLUENCER] },
    ],
  },
  {
    label: 'nav.groups.communication',
    items: [{ label: 'nav.messages', icon: FiMessageSquare, pathSuffix: 'messages', roles: BOTH }],
  },
  {
    label: 'nav.groups.account',
    items: [
      { label: 'nav.profile', icon: FiUser, pathSuffix: 'profile', roles: BOTH },
      { label: 'nav.settings', icon: FiSettings, pathSuffix: 'settings', roles: BOTH },
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
  const { t } = useTranslation();

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

      <VStack as="nav" aria-label={t('nav.main')} spacing={5} align="stretch" px={3} flex={1} overflowY="auto">
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
                  {t(group.label)}
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
                      <Text ml={3}>{t(item.label)}</Text>
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
        <LanguageSwitcher mb={4} />
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
          <Tooltip label={colorMode === 'light' ? t('theme.dark') : t('theme.light')}>
            <IconButton
              aria-label={colorMode === 'light' ? t('theme.switchToDark') : t('theme.switchToLight')}
              icon={<IconWrapper icon={colorMode === 'light' ? FiMoon : FiSun} size="1em" />}
              size="sm"
              variant="ghost"
              colorScheme="gray"
              onClick={toggleColorMode}
            />
          </Tooltip>
          <Tooltip label={t('actions.logout')}>
            <IconButton
              aria-label={t('actions.logout')}
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
  const { t } = useTranslation();

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
          aria-label={t('nav.openMenu')}
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
