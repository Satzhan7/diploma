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

// SVG paths for our icons
const iconPaths = {
  handshake: "M11.721 10.699C11.512 10.699 11.324 10.622 11.115 10.488C10.523 10.103 10.523 9.427 11.115 9.042L17.001 5.572C17.22 5.438 17.408 5.381 17.617 5.381C17.825 5.381 18.014 5.458 18.222 5.592C18.814 5.977 18.814 6.654 18.222 7.038L12.336 10.508C12.117 10.642 11.93 10.699 11.721 10.699ZM16.318 15.439C16.109 15.439 15.92 15.382 15.712 15.248L6.621 9.888C6.029 9.503 6.029 8.827 6.621 8.442C7.212 8.057 8.117 8.057 8.709 8.442L17.8 13.802C18.391 14.187 18.391 14.863 17.8 15.248C17.591 15.382 17.403 15.439 17.194 15.439H16.318ZM5.636 15.439C5.427 15.439 5.239 15.382 5.03 15.248C4.439 14.863 4.439 14.187 5.03 13.802L5.824 13.32C6.415 12.935 7.321 12.935 7.912 13.32C8.503 13.705 8.503 14.381 7.912 14.766L7.118 15.248C6.909 15.382 6.721 15.439 6.512 15.439H5.636ZM3.762 19.958C2.588 19.958 1.583 19.264 1.166 18.188C0.959 17.647 0.92 17.013 1.061 16.386C1.203 15.759 1.518 15.219 1.968 14.785L2.353 14.458C2.366 14.449 2.378 14.44 2.389 14.431L5.003 12.495L5.239 12.337C5.83 11.952 6.736 11.952 7.327 12.337C7.919 12.722 7.919 13.398 7.327 13.783L4.2 15.911L3.833 16.222C3.739 16.303 3.675 16.402 3.642 16.514C3.608 16.627 3.612 16.74 3.645 16.842C3.685 16.962 3.753 17.057 3.843 17.128C3.933 17.198 4.047 17.237 4.174 17.237H14.242C14.642 17.237 15.042 17.34 15.403 17.544L15.407 17.546L15.415 17.551L15.455 17.573C15.466 17.579 15.475 17.584 15.485 17.59C15.499 17.598 15.513 17.606 15.527 17.615L17.539 18.858C17.791 19.015 17.95 19.153 18.025 19.276C18.105 19.399 18.091 19.496 18.067 19.549L18.066 19.552C18.045 19.597 17.994 19.639 17.902 19.664C17.81 19.689 17.706 19.693 17.601 19.661C17.529 19.64 17.469 19.622 17.416 19.608C17.377 19.596 17.339 19.586 17.301 19.574L14.778 18.783C14.621 18.737 14.507 18.733 14.44 18.748C14.373 18.762 14.378 18.781 14.378 18.781L14.378 18.782C14.378 18.782 14.379 18.792 14.396 18.828C14.415 18.866 14.448 18.909 14.506 18.953C14.604 19.028 14.727 19.085 14.891 19.099C14.976 19.106 15.044 19.112 15.112 19.118C15.207 19.126 15.301 19.133 15.406 19.133H21.125C21.263 19.133 21.388 19.077 21.477 18.988C21.567 18.898 21.624 18.772 21.624 18.634V16.637C21.624 16.499 21.567 16.374 21.477 16.284C21.388 16.195 21.263 16.138 21.125 16.138H19.375C18.784 16.138 18.062 15.846 17.8 15.354L17.697 15.166H14.242C13.842 15.167 13.442 15.064 13.082 14.859C13.024 14.829 12.968 14.798 12.914 14.765L9.636 12.736C9.218 12.472 8.893 12.086 8.705 11.624C8.484 11.093 8.451 10.506 8.611 9.956C8.78 9.387 9.135 8.903 9.617 8.602L12.618 6.77C13.209 6.385 14.114 6.385 14.706 6.77C15.297 7.155 15.297 7.831 14.706 8.216L13.007 9.271C12.958 9.3 12.921 9.342 12.898 9.392C12.876 9.442 12.867 9.496 12.874 9.54C12.89 9.634 12.945 9.712 13.03 9.752C13.115 9.793 13.214 9.792 13.315 9.736L16.173 8.029C16.764 7.644 17.67 7.644 18.261 8.029C18.853 8.414 18.853 9.09 18.261 9.475L15.645 11.029C15.273 11.249 14.832 11.369 14.364 11.379H14.356C13.884 11.379 13.441 11.255 13.07 11.036C12.476 10.686 12.043 10.138 11.864 9.498C11.685 8.857 11.774 8.169 12.111 7.588C12.245 7.358 12.415 7.149 12.615 6.967C12.614 6.967 12.613 6.966 12.612 6.966L14.48 5.803C15.071 5.418 15.976 5.418 16.567 5.803C17.158 6.188 17.158 6.864 16.567 7.249L16.318 7.403C16.28 7.426 16.251 7.459 16.233 7.499C16.215 7.539 16.21 7.581 16.217 7.618C16.233 7.699 16.288 7.759 16.36 7.791C16.432 7.824 16.512 7.822 16.588 7.782L17.036 7.516C17.627 7.131 18.533 7.131 19.124 7.516C19.716 7.901 19.716 8.577 19.124 8.962L17.312 10.09C16.939 10.311 16.499 10.432 16.032 10.444H16.023C15.555 10.444 15.112 10.321 14.742 10.1C14.142 9.748 13.708 9.194 13.531 8.546C13.353 7.898 13.447 7.202 13.792 6.617C13.957 6.341 14.173 6.094 14.435 5.887L16.246 4.764C16.836 4.379 17.743 4.379 18.334 4.764C18.926 5.149 18.926 5.825 18.334 6.21L18.173 6.313C17.135 6.929 16.58 8.034 16.751 9.155C16.837 9.71 17.097 10.229 17.494 10.64C17.891 11.052 18.402 11.334 18.957 11.445C19.511 11.556 20.079 11.485 20.594 11.248C21.11 11.012 21.536 10.612 21.809 10.109C22.088 9.596 22.179 9.004 22.066 8.436C21.954 7.868 21.649 7.364 21.205 7.035L19.794 6.107C19.703 6.045 19.623 5.965 19.56 5.872C19.498 5.779 19.454 5.673 19.432 5.562C19.355 5.229 19.506 4.89 19.794 4.695L20.136 4.467C20.728 4.082 21.633 4.082 22.224 4.467C22.816 4.852 22.816 5.528 22.224 5.913L22.075 6.01C22.036 6.033 22.008 6.066 21.991 6.106C21.974 6.146 21.969 6.188 21.977 6.225C21.982 6.248 21.989 6.267 22 6.285C22.01 6.303 22.023 6.319 22.039 6.331C22.054 6.344 22.072 6.353 22.091 6.359C22.111 6.365 22.132 6.369 22.154 6.368C22.225 6.366 22.288 6.343 22.346 6.3L23 5.879C23.591 5.494 24.497 5.494 25.088 5.879C25.679 6.264 25.679 6.94 25.088 7.325L23.933 8.072C23.374 8.504 22.67 8.702 21.965 8.625C21.26 8.548 20.622 8.203 20.175 7.66C19.727 7.117 19.501 6.418 19.551 5.712C19.584 5.221 19.783 4.752 20.12 4.392L21.124 3.657C21.715 3.272 22.621 3.272 23.212 3.657C23.803 4.041 23.803 4.718 23.212 5.103L22.91 5.29C22.873 5.314 22.844 5.349 22.826 5.389C22.808 5.429 22.802 5.47 22.81 5.507C22.825 5.587 22.879 5.648 22.951 5.68C23.023 5.712 23.102 5.711 23.178 5.671L23.588 5.424C24.179 5.039 25.085 5.039 25.676 5.424C26.268 5.809 26.268 6.485 25.676 6.87L24.679 7.479C24.306 7.701 23.865 7.821 23.398 7.832H23.389C22.921 7.832 22.479 7.71 22.109 7.49C21.738 7.27 21.443 6.954 21.255 6.578C21.137 6.35 21.057 6.105 21.019 5.851C20.991 5.666 20.992 5.478 21.019 5.294L19.733 6.14C20.363 6.669 20.782 7.426 20.913 8.27C21.044 9.114 20.897 9.979 20.488 10.726C20.079 11.473 19.43 12.06 18.644 12.396C17.858 12.732 16.993 12.79 16.166 12.558C15.34 12.326 14.612 11.82 14.105 11.122C13.94 10.906 13.802 10.672 13.694 10.424L12.909 10.925C12.346 11.264 11.914 11.795 11.691 12.424C11.467 13.052 11.465 13.741 11.683 14.371C11.902 15.001 12.329 15.536 12.889 15.879L12.893 15.881L12.9 15.886L16.178 17.913C16.815 18.29 17.272 18.918 17.442 19.649L17.442 19.65L17.449 19.673C17.503 19.892 17.617 20.093 17.78 20.26C17.942 20.426 18.147 20.556 18.37 20.633C18.821 20.789 19.308 20.765 19.741 20.566C20.173 20.368 20.513 20.012 20.688 19.574L20.688 19.571L20.689 19.57C20.716 19.488 20.73 19.403 20.741 19.313C20.754 19.211 20.761 19.091 20.761 18.958V15.138C20.761 15 20.704 14.874 20.614 14.784C20.525 14.695 20.399 14.637 20.261 14.637C19.67 14.637 18.947 14.345 18.685 13.853C18.424 13.361 18.561 12.673 19.152 12.288L22.679 10.075C23.269 9.69 24.175 9.69 24.766 10.075C25.358 10.46 25.358 11.136 24.766 11.521L23.964 12.016C23.925 12.039 23.896 12.072 23.879 12.112C23.861 12.152 23.855 12.194 23.863 12.231C23.879 12.311 23.934 12.371 24.006 12.404C24.077 12.436 24.157 12.434 24.233 12.394L25.443 11.642C26.035 11.257 26.94 11.257 27.531 11.642C28.123 12.027 28.123 12.703 27.531 13.088L24.079 15.25C23.707 15.47 23.266 15.59 22.799 15.601H22.79C22.322 15.601 21.879 15.478 21.509 15.258C21.139 15.037 20.844 14.721 20.655 14.345C20.537 14.117 20.457 13.872 20.418 13.617C20.39 13.433 20.393 13.245 20.42 13.061L19.133 13.91C19.73 14.464 20.122 15.222 20.242 16.059C20.304 16.503 20.286 16.954 20.188 17.391C20.091 17.827 19.916 18.239 19.674 18.609L19.673 18.611C19.316 19.128 18.8 19.524 18.202 19.736C17.605 19.949 16.962 19.964 16.355 19.78C15.749 19.596 15.219 19.225 14.843 18.724C14.467 18.224 14.267 17.619 14.273 16.999L11.103 15.025C10.62 14.747 10.219 14.348 9.936 13.866C9.654 13.386 9.493 12.834 9.476 12.267C9.458 11.701 9.583 11.142 9.833 10.642C10.082 10.142 10.457 9.719 10.915 9.412L9.739 8.742C9.051 9.285 8.55 10.051 8.332 10.933C8.113 11.825 8.191 12.768 8.551 13.611C8.639 13.811 8.739 14.004 8.851 14.19L6.848 15.45C6.639 15.583 6.451 15.641 6.242 15.641C6.034 15.641 5.845 15.564 5.636 15.43C5.045 15.045 5.045 14.369 5.636 13.984L5.942 13.794C5.98 13.771 6.008 13.738 6.026 13.698C6.044 13.658 6.05 13.616 6.042 13.579C6.027 13.499 5.973 13.438 5.901 13.405C5.83 13.374 5.75 13.375 5.674 13.415L4.697 14.023C4.402 14.25 4.19 14.575 4.102 14.948C4.024 15.272 4.043 15.618 4.157 15.938C4.195 16.044 4.28 16.227 4.446 16.363C4.614 16.5 4.881 16.555 5.151 16.436C5.742 16.051 6.648 16.051 7.239 16.436C7.83 16.821 7.83 17.497 7.239 17.882L5.552 18.958C5.042 19.273 4.451 19.44 3.842 19.445L3.837 19.445L3.833 19.446C3.809 19.448 3.785 19.451 3.762 19.451V19.958Z",
  chartLine: "M6 13H4C3.44772 13 3 13.4477 3 14V20C3 20.5523 3.44772 21 4 21H6C6.55228 21 7 20.5523 7 20V14C7 13.4477 6.55228 13 6 13ZM13 9H11C10.4477 9 10 9.44771 10 10V20C10 20.5523 10.4477 21 11 21H13C13.5523 21 14 20.5523 14 20V10C14 9.44771 13.5523 9 13 9ZM20 5H18C17.4477 5 17 5.44772 17 6V20C17 20.5523 17.4477 21 18 21H20C20.5523 21 21 20.5523 21 20V6C21 5.44772 20.5523 5 20 5ZM7 7C7 8.65685 8.34315 10 10 10C10.7593 10 11.4468 9.7086 11.9561 9.22421L16.9389 12.7042C16.9785 13.1296 17.0893 13.5383 17.2629 13.9149L11.9389 17.6056C11.4468 17.1214 10.7593 16.83 10 16.83C8.34315 16.83 7 18.1732 7 19.83C7 21.4869 8.34315 22.83 10 22.83C11.6569 22.83 13 21.4869 13 19.83C13 19.467 12.9335 19.1187 12.811 18.795L17.9413 15.1975C18.5576 15.7159 19.3585 16.04 20.2308 16.04C22.157 16.04 23.7173 14.4903 23.7332 12.571L19.2553 7.9583C18.8554 8.46655 18.2871 8.83485 17.6403 8.96928L17.1982 8.96953C16.9904 8.99389 16.7763 9.01575 16.5637 9.0114L12.811 6.205C12.9335 5.8813 13 5.533 13 5.17C13 3.51315 11.6569 2.17 10 2.17C8.34315 2.17 7 3.51315 7 5.17C7 6.82685 8.34315 8.17 10 8.17C10.0203 8.17 10.0405 8.16974 10.0607 8.16923L10.8418 8.169C10.9792 8.15937 11.1159 8.13553 11.2462 8.0932L16.0226 11.0883C16.007 11.17 16 11.2538 16 11.339C16 12.5236 16.9385 13.4847 18.1161 13.5284L18.1946 13.529C18.6481 13.5361 19.1326 13.3385 19.4953 12.967L22.7447 16.3317C22.7481 16.2367 22.75 16.1412 22.75 16.045C22.75 13.7739 21.2402 11.8911 19.1532 11.326L14.2439 7.9058C14.5864 7.12216 14.5717 6.17563 14.1196 5.3882L10.0607 5.38977C10.0405 5.39026 10.0203 5.39 10 5.39C9.30047 5.39 8.67222 5.09223 8.23417 4.62295L8.15021 4.62315C7.99183 4.63378 7.83539 4.65845 7.68291 4.69577L7.5 4.7C7.5 4.84537 7.48899 4.98775 7.46813 5.12656L8.34315 5.51315C8.59661 5.64116 8.82426 5.80676 9.02069 6.00319C9.17 6.1525 9.30047 6.32124 9.41074 6.50544L9.89 6.75C9.9616 6.84035 10.0201 6.95982 10.0607 7.10077C10.0405 7.10026 10.0203 7.1 10 7.1C8.95589 7.1 8.0857 6.71062 7.5 6.06677V7Z",
  userCheck: "M16 5C16 7.20914 14.2091 9 12 9C9.79086 9 8 7.20914 8 5C8 2.79086 9.79086 1 12 1C14.2091 1 16 2.79086 16 5ZM12 13C8.13401 13 5 16.134 5 20V23H19V20C19 16.134 15.866 13 12 13ZM22.0318 10.5318L19.5 13.0635L18.4682 12.0318C18.1821 11.7456 17.7194 11.7456 17.4332 12.0318C17.1471 12.3179 17.1471 12.7806 17.4332 13.0668L18.9651 14.5986C19.251 14.8845 19.749 14.8845 20.0349 14.5986L23.0668 11.5668C23.3529 11.2806 23.3529 10.8179 23.0668 10.5318C22.7806 10.2456 22.3179 10.2456 22.0318 10.5318Z"
};

// Create dedicated components for each icon using SVG directly
const HandshakeIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="40" 
    height="40" 
    viewBox="0 0 28 24" 
    fill="#4299E1"
    style={{ margin: '0 auto' }}
  >
    <path d={iconPaths.handshake} />
  </svg>
);

const ChartLineIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="40" 
    height="40" 
    viewBox="0 0 24 24" 
    fill="#4299E1"
    style={{ margin: '0 auto' }}
  >
    <path d={iconPaths.chartLine} />
  </svg>
);

const UserCheckIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="40" 
    height="40" 
    viewBox="0 0 24 24" 
    fill="#4299E1"
    style={{ margin: '0 auto' }}
  >
    <path d={iconPaths.userCheck} />
  </svg>
);

// Simple feature structure with component references
const features = [
  {
    title: 'Connect',
    description: 'Connect brands with influencers seamlessly',
    IconComponent: HandshakeIcon,
  },
  {
    title: 'Grow',
    description: 'Grow your business with targeted collaborations',
    IconComponent: ChartLineIcon,
  },
  {
    title: 'Verify',
    description: 'Work with verified and trusted partners',
    IconComponent: UserCheckIcon,
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
                  <feature.IconComponent />
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