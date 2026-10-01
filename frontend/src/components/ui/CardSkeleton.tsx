import React from 'react';
import {
  Card,
  CardBody,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Flex,
  SimpleGridProps,
} from '@chakra-ui/react';

// Layout-matched skeletons — same dimensions as the content they replace,
// so loading → loaded causes no layout shift (docs/UI_PERFORMANCE.md).

export const StatCardSkeleton: React.FC = () => (
  <Card>
    <CardBody p={5}>
      <Flex align="center" gap={4}>
        <Skeleton boxSize="44px" borderRadius="lg" flexShrink={0} />
        <Flex direction="column" gap={2} flex={1}>
          <Skeleton height="14px" maxW="120px" />
          <Skeleton height="28px" maxW="80px" />
        </Flex>
      </Flex>
    </CardBody>
  </Card>
);

interface CardGridSkeletonProps {
  count?: number;
  columns?: SimpleGridProps['columns'];
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  columns = { base: 1, md: 2, xl: 3 },
}) => (
  <SimpleGrid columns={columns} spacing={6}>
    {Array.from({ length: count }, (_, i) => (
      <Card key={i}>
        <CardBody p={5}>
          <Skeleton height="20px" maxW="60%" mb={4} />
          <SkeletonText noOfLines={3} spacing={3} skeletonHeight="12px" />
          <Skeleton height="32px" maxW="120px" mt={5} borderRadius="md" />
        </CardBody>
      </Card>
    ))}
  </SimpleGrid>
);
