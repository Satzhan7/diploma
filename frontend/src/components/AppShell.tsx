import React from 'react';
import {
  Avatar,
  Box,
  Flex,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import {
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiFilePlus,
  FiHome,
  FiList,
  FiLogOut,
  FiMessageSquare,
  FiSearch,
  FiSend,
  FiSettings,
  FiShield,
  FiStar,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { UserRole } from '../types/user';
import { useAuth } from '../contexts/AuthContext';
import { IconWrapper } from './IconWrapper';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import ColorModeToggle from './ColorModeToggle';
import { layout } from '../theme';

interface NavItem {
  /** `common:nav.<key>` (sidebar) and `common:nav.short.<key>` (tab bar). */
  key: string;
  to: string;
  icon: IconType;
  /** Hidden from the mobile tab bar (the page links to it instead). */
  noTab?: boolean;
}

const NAV: Partial<Record<UserRole, NavItem[]>> = {
  [UserRole.BRAND]: [
    { key: 'home', to: '/brand/dashboard', icon: FiHome },
    { key: 'newBrief', to: '/brand/briefs/new', icon: FiFilePlus, noTab: true },
    { key: 'briefs', to: '/brand/briefs', icon: FiList },
    { key: 'applicants', to: '/brand/applicants', icon: FiUsers },
    { key: 'deals', to: '/brand/deals', icon: FiCheckCircle },
    { key: 'messages', to: '/brand/messages', icon: FiMessageSquare },
    { key: 'plan', to: '/brand/plan', icon: FiStar, noTab: true },
  ],
  [UserRole.INFLUENCER]: [
    { key: 'findBriefs', to: '/influencer/briefs', icon: FiSearch },
    { key: 'myApplications', to: '/influencer/applications', icon: FiSend },
    { key: 'deals', to: '/influencer/deals', icon: FiCheckCircle },
    { key: 'messages', to: '/influencer/messages', icon: FiMessageSquare },
    { key: 'profile', to: '/influencer/profile', icon: FiUser },
    { key: 'stats', to: '/influencer/stats', icon: FiBarChart2, noTab: true },
  ],
  [UserRole.ADMIN]: [
    { key: 'verifications', to: '/admin/verifications', icon: FiShield },
    { key: 'adminBrands', to: '/admin/brands', icon: FiBriefcase },
  ],
};

// Shell geometry comes from theme `sizes` (sidebar, topbar, tabbar, navItem);
// chrome floats 12 px (space 3) from the viewport edges, the tab bar 18 px above the safe area.
const INSET = 3;
const TABBAR_BOTTOM = '18px';
const SIZE = (name: string) => `var(--chakra-sizes-${name})`;
const SPACE = (n: number) => `var(--chakra-space-${n})`;

/** Longest matching prefix, so "New brief" wins over "Briefs" on /briefs/new. */
function activeItem(items: NavItem[], pathname: string) {
  return items
    .filter((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
}

const AccountMenu: React.FC<{ role?: UserRole; compact?: boolean }> = ({ role, compact }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const base = role === UserRole.BRAND ? '/brand' : '/influencer';

  const avatar = <Avatar size="sm" name={user?.name} bg="primary.soft" color="primary.ink" fontWeight="700" />;

  return (
    <Menu placement={compact ? 'bottom-start' : 'top-start'}>
      <MenuButton
        aria-label={t('nav.account')}
        borderRadius={compact ? 'full' : 'md'}
        w={compact ? undefined : 'full'}
        p={compact ? 0 : 2}
        _hover={{ bg: compact ? undefined : 'bg.subtle' }}
        textAlign="left"
      >
        {compact ? (
          avatar
        ) : (
          <HStack spacing={3}>
            {avatar}
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                {user?.name}
              </Text>
              <Text fontSize="xs" color="fg.muted" noOfLines={1}>
                {role ? t(`role.${role}`) : ''}
              </Text>
            </Box>
          </HStack>
        )}
      </MenuButton>
      <MenuList zIndex="popover">
        <Box px={3} py={2}>
          <Text fontSize="sm" fontWeight="600" noOfLines={1}>
            {user?.name}
          </Text>
          <Text fontSize="xs" color="fg.muted" noOfLines={1}>
            {user?.email}
          </Text>
        </Box>
        <MenuDivider />
        {role === UserRole.BRAND && (
          <MenuItem icon={<IconWrapper icon={FiUser} size="1em" />} onClick={() => navigate(`${base}/profile`)}>
            {t('nav.profile')}
          </MenuItem>
        )}
        {role === UserRole.BRAND && (
          <MenuItem icon={<IconWrapper icon={FiStar} size="1em" />} onClick={() => navigate('/brand/plan')}>
            {t('nav.plan')}
          </MenuItem>
        )}
        {role === UserRole.INFLUENCER && (
          <MenuItem icon={<IconWrapper icon={FiBarChart2} size="1em" />} onClick={() => navigate('/influencer/stats')}>
            {t('nav.stats')}
          </MenuItem>
        )}
        {role !== UserRole.ADMIN && (
          <MenuItem icon={<IconWrapper icon={FiSettings} size="1em" />} onClick={() => navigate(`${base}/settings`)}>
            {t('nav.settings')}
          </MenuItem>
        )}
        {compact && (
          <Box px={3} py={2}>
            <LanguageSwitcher />
          </Box>
        )}
        <MenuDivider />
        <MenuItem
          icon={<IconWrapper icon={FiLogOut} size="1em" />}
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          {t('actions.logout')}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

const AppShell: React.FC<{ children: React.ReactNode; role?: UserRole }> = ({ children, role }) => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const items = (role && NAV[role]) || [];
  const active = activeItem(items, pathname);
  const tabs = items.filter((i) => !i.noTab);

  return (
    <Box minH="100vh">
      <Link
        href="#main"
        position="absolute"
        left={4}
        top={-20}
        zIndex="skipLink"
        bg="bg.surface"
        px={4}
        py={2}
        borderRadius="md"
        _focus={{ top: 4 }}
      >
        {t('nav.skipToContent')}
      </Link>

      {/* Desktop: floating glass sidebar */}
      <Flex
        as="aside"
        display={{ base: 'none', lg: 'flex' }}
        position="fixed"
        top={INSET}
        bottom={INSET}
        left={INSET}
        w="sidebar"
        direction="column"
        gap={6}
        px={3}
        py={5}
        layerStyle="glass"
        borderRadius="2xl"
        zIndex="sticky"
      >
        <RouterLink to="/" aria-label="AdPartners.kz">
          <Logo ml={2} sx={{ svg: { height: '30px', width: 'auto' } }} />
        </RouterLink>
        <VStack as="nav" aria-label={t('nav.main')} spacing="2px" align="stretch" flex={1} overflowY="auto">
          {items.map((item) => {
            const on = item === active;
            return (
              <Link
                key={item.key}
                as={RouterLink}
                to={item.to}
                aria-current={on ? 'page' : undefined}
                display="flex"
                alignItems="center"
                gap={3}
                minH="navItem"
                px={3}
                borderRadius="md"
                fontSize="sm"
                fontWeight={on ? 700 : 500}
                bg={on ? 'primary.soft' : 'transparent'}
                color={on ? 'primary.ink' : 'fg.muted'}
                _hover={{
                  textDecoration: 'none',
                  color: on ? 'primary.ink' : 'fg.default',
                  bg: on ? 'primary.soft' : 'bg.subtle',
                }}
              >
                <IconWrapper icon={item.icon} size="20px" />
                <Text as="span">{t(`nav.${item.key}`)}</Text>
              </Link>
            );
          })}
        </VStack>
        <VStack align="stretch" spacing={3} pt={3} borderTopWidth="1px" borderColor="border.default">
          <HStack justify="space-between" px={1}>
            <LanguageSwitcher />
            <ColorModeToggle size="sm" />
          </HStack>
          <AccountMenu role={role} />
        </VStack>
      </Flex>

      {/* Mobile: glass top bar */}
      <Flex
        as="header"
        display={{ base: 'flex', lg: 'none' }}
        position="fixed"
        top={INSET}
        left={INSET}
        right={INSET}
        h="topbar"
        align="center"
        justify="space-between"
        px={3}
        layerStyle="glass"
        borderRadius="2xl"
        zIndex="sticky"
      >
        <AccountMenu role={role} compact />
        <Text textStyle="label" fontSize="md" noOfLines={1}>
          {active ? t(`nav.${active.key}`) : 'AdPartners'}
        </Text>
        <ColorModeToggle size="md" />
      </Flex>

      {/* Mobile: floating glass tab bar */}
      {tabs.length > 1 && (
        <Flex
          as="nav"
          aria-label={t('nav.main')}
          display={{ base: 'flex', lg: 'none' }}
          position="fixed"
          bottom={`calc(${TABBAR_BOTTOM} + env(safe-area-inset-bottom))`}
          left={5}
          right={5}
          h="tabbar"
          px={1.5}
          layerStyle="glass"
          borderRadius="3xl"
          zIndex="sticky"
        >
          {tabs.map((item) => {
            const on = item === active;
            return (
              <Link
                key={item.key}
                as={RouterLink}
                to={item.to}
                aria-current={on ? 'page' : undefined}
                aria-label={t(`nav.${item.key}`)}
                flex={1}
                minW={0}
                my={1.5}
                borderRadius="2xl"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap={0.5}
                textStyle="caption"
                fontWeight="600"
                bg={on ? 'primary.soft' : 'transparent'}
                color={on ? 'primary.ink' : 'fg.default'}
                _hover={{ textDecoration: 'none' }}
              >
                <IconWrapper icon={item.icon} size="20px" />
                <Text as="span" noOfLines={1} maxW="full" px={1}>
                  {t(`nav.short.${item.key}`)}
                </Text>
              </Link>
            );
          })}
        </Flex>
      )}

      <Box
        as="main"
        id="main"
        tabIndex={-1}
        // Content starts after the sidebar + its inset; page padding (layout.pageX) is then
        // the same on both sides. Below lg it clears the top bar and the tab bar.
        ml={{ base: 0, lg: `calc(${SIZE('sidebar')} + ${SPACE(INSET)})` }}
        pt={{
          base: `calc(${SIZE('topbar')} + 2 * ${SPACE(INSET)} + ${SPACE(layout.pageY.base)})`,
          lg: layout.pageY.lg,
        }}
        pb={{ base: `calc(${SIZE('tabbar')} + ${TABBAR_BOTTOM} + ${SPACE(6)} + env(safe-area-inset-bottom))`, lg: 10 }}
        px={layout.pageX}
        minW={0}
        _focus={{ outline: 'none' }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppShell;
