import React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Stack,
  Link,
  Icon,
  Text,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Drawer,
  DrawerContent,
  IconButton,
  useColorModeValue,
  BoxProps,
  FlexProps,
} from '@chakra-ui/react';
import {
  AiOutlineHome,
  AiOutlineLineChart,
  AiOutlineCompass,
  AiOutlineStar,
  AiOutlineSetting,
  AiOutlineMenu,
  AiOutlineDown,
  AiOutlineMessage,
} from 'react-icons/ai';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/user';

// Custom component to wrap React Icons
const IconWrapper = ({ icon: IconComponent, ...props }: { icon: React.ComponentType<any> } & any) => {
  return <IconComponent {...props} />;
};

// Custom component for IconButton
const IconButtonWithIcon = ({ icon: IconComponent, ...props }: { icon: React.ComponentType<any> } & any) => {
  return <IconButton icon={<IconWrapper icon={IconComponent} size={20} />} {...props} />;
};

interface LinkItemProps {
  name: string;
  icon: any;
  path: string;
}

const BrandLinks: Array<LinkItemProps> = [
  { name: 'Overview', icon: AiOutlineHome, path: '/dashboard/brand' },
  { name: 'Find Influencers', icon: AiOutlineCompass, path: '/dashboard/brand/influencers' },
  { name: 'Campaigns', icon: AiOutlineLineChart, path: '/dashboard/brand/campaigns' },
  { name: 'Messages', icon: AiOutlineMessage, path: '/dashboard/brand/messages' },
  { name: 'Settings', icon: AiOutlineSetting, path: '/dashboard/brand/settings' },
];

const InfluencerLinks: Array<LinkItemProps> = [
  { name: 'Overview', icon: AiOutlineHome, path: '/dashboard/influencer' },
  { name: 'Find Brands', icon: AiOutlineCompass, path: '/dashboard/influencer/brands' },
  { name: 'My Campaigns', icon: AiOutlineStar, path: '/dashboard/influencer/campaigns' },
  { name: 'Messages', icon: AiOutlineMessage, path: '/dashboard/influencer/messages' },
  { name: 'Settings', icon: AiOutlineSetting, path: '/dashboard/influencer/settings' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'brand' | 'influencer';
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const links = userRole === 'brand' ? BrandLinks : InfluencerLinks;

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
        links={links}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} links={links} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
  links: Array<LinkItemProps>;
}

const SidebarContent = ({ onClose, links, ...rest }: SidebarProps) => {
  const location = useLocation();

  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
          Logo
        </Text>
      </Flex>
      {links.map((link) => (
        <NavItem
          key={link.name}
          icon={link.icon}
          path={link.path}
          isActive={location.pathname === link.path}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

interface NavItemProps extends FlexProps {
  icon: any;
  path: string;
  isActive?: boolean;
  children: React.ReactNode;
}

const NavItem = ({ icon, path, isActive, children, ...rest }: NavItemProps) => {
  return (
    <Link
      as={RouterLink}
      to={path}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'cyan.400' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{
          bg: 'cyan.400',
          color: 'white',
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'white',
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}

const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButtonWithIcon
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={AiOutlineMenu}
      />

      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
      >
        Logo
      </Text>

      <Menu>
        <MenuButton
          py={2}
          transition="all 0.3s"
          _focus={{ boxShadow: 'none' }}
        >
          <Flex align="center">
            <Avatar
              size="sm"
              name={user?.name}
              src={user?.profile?.avatarUrl || undefined}
            />
            <Box ml="2" display={{ base: 'none', md: 'flex' }}>
              <Text fontSize="sm">{user?.name}</Text>
              <Text fontSize="xs" color="gray.600">
                {user?.role}
              </Text>
            </Box>
            <Box ml="2">
              <IconWrapper icon={AiOutlineDown} size={16} />
            </Box>
          </Flex>
        </MenuButton>
        <MenuList>
          <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Sign out</MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}; 