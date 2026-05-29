import React from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Container,
  Flex,
  HStack,
  SimpleGrid,
  Image,
  Icon,
  Divider,
  Link as ChakraLink,
  useColorModeValue,
  Card, CardBody, CardFooter,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiTarget, FiTrendingUp, FiShield, FiDollarSign, FiUsers, FiThumbsUp } from 'react-icons/fi';
import { IconType } from 'react-icons';
import Logo from '../components/Logo';
import { IconWrapper } from '../components/IconWrapper';

// Placeholder component for partner logos
const PartnerLogo = ({ name, icon }: { name: string, icon?: React.ElementType }) => (
  <VStack spacing={1}>
    {icon ? <Icon as={icon} boxSize={10} color="gray.500" /> : null}
    <Text fontSize="sm" color="gray.600">{name}</Text>
  </VStack>
);

// --- Helper Sub-components ---
const FeatureItem = ({ icon, title, text }: { icon: IconType, title: string, text: string }) => {
  const iconColor = useColorModeValue("blue.500", "blue.300");
  return (
    <HStack align="start" spacing={4}>
      <IconWrapper 
        icon={icon} 
        color={iconColor} 
        mt={1}
        size="2rem"
        flexShrink={0}
      />
      <Box>
        <Heading size="md" mb={1}>{title}</Heading>
        <Text color={useColorModeValue('gray.600', 'gray.300')}>{text}</Text>
      </Box>
    </HStack>
  );
};

const ChoiceItem = ({ title, text }: { title: string, text: string }) => (
  <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="green.300" bg={useColorModeValue('white', 'gray.700')} boxShadow="sm">
    <Heading size="md" mb={2}>{title}</Heading>
    <Text color={useColorModeValue('gray.600', 'gray.300')}>{text}</Text>
  </Box>
);

const HowItWorksStep = ({ num, title, text }: { num: number, title: string, text: string }) => (
  <HStack align="center" spacing={6}>
    <Flex 
      w={12} h={12} 
      align="center" 
      justify="center" 
      borderRadius="full" 
      bg="blue.500" 
      color="white" 
      fontSize="2xl" 
      fontWeight="bold"
      flexShrink={0}
    >
      {num}
    </Flex>
    <Box>
      <Heading size="lg" mb={1}>{title}</Heading>
      <Text fontSize="lg" color={useColorModeValue('gray.700', 'gray.200')}>{text}</Text>
    </Box>
  </HStack>
);

const CourseCard = ({ title, imgSrc }: { title: string, imgSrc: string }) => (
  <Card overflow="hidden" bg={useColorModeValue('white', 'gray.700')} boxShadow="md">
    <Image 
      src={imgSrc} 
      alt={title} 
      objectFit="cover" 
      h="200px"
    />
    <CardBody>
      <Heading size="md" mb={2}>{title}</Heading>
    </CardBody>
    <CardFooter>
      <Button variant="outline" colorScheme="blue" size="sm">Go to course</Button>
    </CardFooter>
  </Card>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
  <Box w="100%">
    <Heading size="md" mb={2}>{question}</Heading>
    <Text color={useColorModeValue('gray.600', 'gray.300')}>{answer}</Text>
  </Box>
);
// --- End Helper Sub-components ---

const Landing: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const curveBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <Box>
      {/* Header - Updated for Hero Integration */}
      <Box 
        as="header" 
        py={4} 
        px={{ base: 4, md: 8 }} 
        bg="transparent"
        position="absolute"
        top={0} 
        left={0}
        right={0}
        zIndex="sticky"
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Logo /> 
            <HStack spacing={{ base: 2, md: 6 }}>
              <ChakraLink href="#features" fontSize="sm" fontWeight="medium" color="whiteAlpha.800" _hover={{ color: 'white' }}>Features</ChakraLink>
              <ChakraLink href="#howitworks" fontSize="sm" fontWeight="medium" color="whiteAlpha.800" _hover={{ color: 'white' }}>How it Works</ChakraLink>
              <ChakraLink href="#faq" fontSize="sm" fontWeight="medium" color="whiteAlpha.800" _hover={{ color: 'white' }}>FAQ</ChakraLink>
              <Button as={RouterLink} to="/login" variant="ghost" size="sm" color="whiteAlpha.800" _hover={{ color: 'white', bg:'whiteAlpha.200' }}>Login</Button>
              <Button as={RouterLink} to="/register" colorScheme="whiteAlpha" variant="outline" size="sm" display={{ base: 'none', sm: 'inline-flex' }}>Sign Up</Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section - Adjusted styling */}
      <Box 
        position="relative"
        color="white" 
        overflow="hidden"
        pt={{ base: 24, md: 32 }} 
        pb={{ base: 16, md: 24 }} 
        backgroundImage={"/images/welcome.jpg"}
        backgroundSize="cover"
        backgroundPosition="center center"
        backgroundRepeat="no-repeat"
      >
        {/* Dark Overlay */}
        <Box 
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.700"
          zIndex={0}
        />

        {/* Content Container */}
        <Container maxW="container.xl" textAlign={{ base: 'center', md: 'left' }} zIndex={1} position="relative">
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="flex-start" minHeight={{ md: '60vh' }}>
            {/* Text content (Constrained width on desktop) */}
            <VStack 
              spacing={6} 
              align={{ base: 'center', md: 'flex-start' }} 
              maxW={{ md: '50%' }}
              zIndex={2}
            >
              <Heading as="h1" size={{ base: '2xl', md: '3xl' }} color="white" fontWeight="bold" lineHeight="1.2">
                Welcome to Your Ultimate Brand-Influencer Connection Platform
              </Heading>
              <ChakraLink 
                 as={RouterLink} 
                 to="/register" 
                 color="white" 
                 fontSize={{ base: 'lg', md: 'xl' }}
                 fontWeight="medium"
                 textDecoration="underline"
                 _hover={{ color: 'gray.200' }}
                 mt={4} 
               >
                Try it!
              </ChakraLink>
            </VStack>
          </Flex>
        </Container>
      </Box>

      {/* Intro Section */}
      <Container maxW="container.lg" py={{ base: 12, md: 20 }}>
        <HStack spacing={{ base: 3, md: 4 }} align="start">
          <Box w="4px" bg="green.400" alignSelf="stretch" borderRadius="full" />
          <Text fontSize={{ base: 'lg', md: 'xl' }} color={textColor}>
            We connect local influencers with top brands in Kazakhstan and the CIS region, making collaborations seamless, efficient, and impactful. Whether you're a business looking to expand your reach or an influencer seeking exciting opportunities, our platform is designed to help you grow
          </Text>
        </HStack>
      </Container>
      
      {/* Features Section (Brands/Influencers) */}
      <Box bg={curveBg} py={{ base: 12, md: 20 }} id="features">
        <Container maxW="container.lg">
          {/* For Brands */}
          <Flex direction={{ base: 'column-reverse', md: 'row' }} align="center" justify="space-between" mb={{ base: 12, md: 24 }}>
            <VStack align={{ base: 'center', md: 'start' }} spacing={6} maxW={{ md: '50%' }} textAlign={{ base: 'center', md: 'left' }} mr={{ md: 8 }}>
              <Heading size="xl" color={headingColor}>For Brands</Heading>
              <FeatureItem icon={FiTarget} title="Find the Perfect Match" text="Discover influencers that align with your brand values and audience." />
              <FeatureItem icon={FiTrendingUp} title="Easy Campaign Management" text="Track performance, engagement, and ROI effortlessly." />
              <FeatureItem icon={FiShield} title="Data-Driven Insights" text="Make informed decisions with real-time analytics and reporting." />
            </VStack>
            <Box maxW={{ base: '80%', md: '45%' }} mb={{ base: 8, md: 0 }} flexShrink={0}>
              {/* Use local image for brand */}
              <Image 
                src="/images/forbrands.jpg"
                alt="Brand collaboration example"
                borderRadius="lg" 
                boxShadow="md"
                objectFit="cover"
                maxH="400px"
              />
            </Box>
          </Flex>

          {/* For Influencers */}
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
             <Box maxW={{ base: '80%', md: '45%' }} mb={{ base: 8, md: 0 }} order={{ base: 2, md: 1 }} flexShrink={0} mr={{ md: 8 }}>
              {/* Use local image for influencer */}
              <Image 
                src="/images/forinfluencers.jpg"
                alt="Influencer creating content"
                borderRadius="lg" 
                boxShadow="md"
                objectFit="cover"
                maxH="400px"
              />
            </Box>
            <VStack align={{ base: 'center', md: 'start' }} spacing={6} maxW={{ md: '50%' }} textAlign={{ base: 'center', md: 'left' }} order={{ base: 1, md: 2 }}>
              <Heading size="xl" color={headingColor}>For Influencers</Heading>
              <FeatureItem icon={FiDollarSign} title="Monetize Your Influence" text="Get paid partnerships with leading brands." />
              <FeatureItem icon={FiUsers} title="Expand Your Reach" text="Connect with new audiences and grow your community." />
              <FeatureItem icon={FiThumbsUp} title="Flexible Collaboration" text="Work on projects that fit your niche and style." />
            </VStack>
          </Flex>
        </Container>
      </Box>

      {/* Why Choose Us? */}
      <Container maxW="container.lg" py={{ base: 12, md: 20 }}>
        <VStack spacing={{ base: 8, md: 12 }}>
          <Heading textAlign="center" size="xl" color={headingColor}>Why choose us?</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="100%">
            <ChoiceItem title="AI-Powered Matching" text="Connect with the best fit for your needs" />
            <ChoiceItem title="Seamless Communication" text="Manage collaborations in one place" />
            <ChoiceItem title="Transparent & Secure" text="Verified influencers and trusted brands" />
            <ChoiceItem title="Performance Tracking" text="Get real-time insights and analytics" />
          </SimpleGrid>
        </VStack>
      </Container>

      {/* How It Works? */}
      <Box bg={curveBg} py={{ base: 12, md: 20 }} id="howitworks">
        <Container maxW="container.xl">
           <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" align={{ base: 'center', lg: 'start' }} gap={12}>
             <VStack spacing={10} align="start" flex={2} >
                <Heading size="2xl" color={headingColor}>HOW IT WORKS?</Heading>
                <HowItWorksStep num={1} title="Sign Up & Create a Profile" text="Register as a brand or an influencer." />
                <HowItWorksStep num={2} title="Match & Connect" text="Our AI suggests the best collaborations." />
                <HowItWorksStep num={3} title="Launch & Track" text="Run campaigns and measure success." />
                <HowItWorksStep num={4} title="Get Paid Securely" text="Hassle-free payments and transactions." />
              </VStack>
              <VStack 
                spacing={6} 
                bg={cardBg} 
                p={{ base: 6, md: 8 }} 
                borderRadius="lg" 
                boxShadow="md" 
                textAlign="center" 
                alignSelf={{ base: 'stretch', lg: 'center' }} 
                justify="center" 
                flex={1}
                minH={{ lg: "300px" }}
              >
                  <Heading size="lg" color={headingColor}>Need free consultation?</Heading>
                  <Button as={RouterLink} to="/login" variant="outline" colorScheme="blue" size="lg">
                    Login
                  </Button>
              </VStack>
           </Flex>
        </Container>
      </Box>

      {/* Our Partners */}
       <Container maxW="container.lg" py={{ base: 12, md: 20 }}>
        <VStack spacing={{ base: 8, md: 12 }}>
          <Heading textAlign="center" size="xl" color={headingColor}>Our Partners</Heading>
          <Box bg={cardBg} p={{ base: 6, md: 8 }} borderRadius="xl" boxShadow="lg" w="fit-content" maxW="100%">
            <HStack spacing={{ base: 4, sm: 6, md: 12 }} justify="center" wrap="wrap">
              {/* Add actual logos later */}
              <PartnerLogo name="Google" />
              <PartnerLogo name="Y Combinator" />
              <PartnerLogo name="Uber" />
              <PartnerLogo name="PayPal" />
              <PartnerLogo name="OpenAI" />
            </HStack>
          </Box>
        </VStack>
      </Container>

      {/* Recommended Courses */}
       <Box bg={bgColor} py={{ base: 12, md: 20 }}>
        <Container maxW="container.lg">
          <VStack spacing={{ base: 8, md: 12 }}>
            <Heading textAlign="center" size="xl" color={headingColor}>Recommended courses for influencers</Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={8} w="100%">
              <CourseCard title="Influence Academy: Build, Brand & Monetize" imgSrc="https://picsum.photos/seed/course1/300/200" />
              <CourseCard title="Content Empire: From Posts to Profit" imgSrc="https://picsum.photos/seed/course2/300/200" />
              <CourseCard title="Viral Blueprint: Scale Your Influence" imgSrc="https://picsum.photos/seed/course3/300/200" />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* FAQ */}
      <Container maxW="container.md" py={{ base: 12, md: 20 }} id="faq">
        <VStack spacing={6} align="stretch">
          <Heading size="xl" color={headingColor} textAlign="center" mb={6}>FAQ</Heading>
          <FAQItem 
            question="How do I register as a brand or an influencer?" 
            answer="You can sign up by clicking the 'Register' button on the homepage and selecting your role (brand or influencer). Fill out your profile to start connecting!"
          />
           <Divider />
          <FAQItem 
            question="Is the platform free to use?" 
            answer="Yes, creating an account is free for both brands and influencers. Some advanced features may be available through premium plans in the future."
          />
           <Divider />
           <FAQItem 
            question="How does the matching system work?" 
            answer="Our AI-based algorithm analyzes your profile, interests, and campaign needs to recommend the most relevant and compatible collaborations."
          />
           <Divider />
           <FAQItem 
            question="How do I get paid as an influencer?" 
            answer="Payments are processed securely through the platform once the brand approves your work. You'll be notified when funds are transferred to your account."
          />
           <Divider />
           <FAQItem 
            question="Can I run multiple campaigns at once?" 
            answer="Absolutely! Both brands and influencers can manage multiple ongoing campaigns from their dashboard for maximum flexibility and reach."
          />
        </VStack>
      </Container>

      {/* Contact Us / Footer */}
      <Box bg="gray.800" color="gray.300" py={{ base: 10, md: 16 }}>
        <Container maxW="container.lg">
          <VStack spacing={4} textAlign="center">
            <Heading size="lg" color="white">Contact us</Heading>
            <Text>adpartners_support@gmail.com</Text>
            <Text>+7 777 777 77 77</Text>
            <Text>Kazakhstan, Kaskelen, Abylaykhan street 1</Text>
            <Text fontSize="sm" color="gray.500" pt={6}>
              © {new Date().getFullYear()} adPartners. All rights reserved.
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing; 