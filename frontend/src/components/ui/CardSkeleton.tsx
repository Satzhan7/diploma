import React from 'react';
import { Card, CardBody, Skeleton, SkeletonText, Flex } from '@chakra-ui/react';
import { ResponsiveGrid } from './Layout';

// Layout-matched skeletons — same dimensions as the content they replace,
// so loading → loaded causes no layout shift (docs/PROJECT.md).

export const StatCardSkeleton: React.FC = () => (
  <Card>
    <CardBody>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'flex-start', sm: 'center' }}
        gap={{ base: 3, sm: 4 }}
      >
        <Skeleton boxSize="control.touch" borderRadius="lg" flexShrink={0} />
        <Flex direction="column" gap={2} flex={1}>
          <Skeleton h={3.5} maxW={28} />
          <Skeleton h={7} maxW={20} />
        </Flex>
      </Flex>
    </CardBody>
  </Card>
);

interface CardGridSkeletonProps {
  count?: number;
}

// Same auto-fill grid as the card lists it stands in for.
export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({ count = 6 }) => (
  <ResponsiveGrid>
    {Array.from({ length: count }, (_, i) => (
      <Card key={i}>
        <CardBody>
          <Skeleton h={5} maxW="60%" mb={4} />
          <SkeletonText noOfLines={3} spacing={3} skeletonHeight={3} />
          <Skeleton h={8} maxW={28} mt={5} borderRadius="md" />
        </CardBody>
      </Card>
    ))}
  </ResponsiveGrid>
);
