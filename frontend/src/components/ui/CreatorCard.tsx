import React from 'react';
import { Avatar, Box, Flex, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { FiImage } from 'react-icons/fi';
import { ScoreRing } from './ScoreRing';
import { VerifiedBadge } from './VerifiedBadge';

export interface CreatorStat {
  label: string;
  value: string;
}

interface CreatorCardProps {
  name: string;
  avatarUrl?: string | null;
  caption?: string | null;
  verified?: boolean;
  /** 0–100 match score. */
  score: number;
  scoreLabel: string;
  stats: CreatorStat[];
  /** The creator's pitch. */
  quote?: string | null;
  price: React.ReactNode;
  priceCaption?: React.ReactNode;
  /** Label of the content strip; it shows placeholders until portfolios exist. */
  stripLabel: string;
  actions?: React.ReactNode;
  /** Shortlisted cards get a primary outline. */
  highlighted?: boolean;
}

/** An applicant in the Applicants feed: who, how well they fit, what they ask. */
export const CreatorCard: React.FC<CreatorCardProps> = ({
  name,
  avatarUrl,
  caption,
  verified,
  score,
  scoreLabel,
  stats,
  quote,
  price,
  priceCaption,
  stripLabel,
  actions,
  highlighted,
}) => (
  <Flex
    as="article"
    layerStyle="card"
    direction="column"
    minW={0}
    overflow="hidden"
    borderColor={highlighted ? 'primary' : undefined}
  >
    <HStack spacing={3} p={{ base: 4, md: 5 }} pb={3}>
      <Avatar size="md" name={name} src={avatarUrl ?? undefined} bg="primary.soft" color="primary.ink" />
      <Box flex="1" minW={0}>
        <Text fontWeight="700" noOfLines={1}>
          {name}
        </Text>
        {caption && (
          <Text fontSize="sm" color="fg.muted" noOfLines={1}>
            {caption}
          </Text>
        )}
        {verified && (
          <Box mt={1}>
            <VerifiedBadge />
          </Box>
        )}
      </Box>
      <ScoreRing value={score} label={scoreLabel} />
    </HStack>

    <SimpleGrid columns={3} spacing={1} px={{ base: 4, md: 5 }} role="img" aria-label={stripLabel}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          aspectRatio={4 / 5}
          bg="bg.subtle"
          borderRadius="md"
          display="grid"
          placeItems="center"
          color="fg.subtle"
          aria-hidden
        >
          <FiImage />
        </Box>
      ))}
    </SimpleGrid>

    <Flex direction="column" gap={3} p={{ base: 4, md: 5 }} pt={3} flex="1">
      <HStack spacing={4} wrap="wrap" fontSize="sm">
        {stats.map((stat) => (
          <Text key={stat.label}>
            <Text as="b" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {stat.value}
            </Text>{' '}
            <Text as="span" color="fg.muted">
              {stat.label}
            </Text>
          </Text>
        ))}
      </HStack>
      {quote && (
        <Text fontSize="sm" color="fg.muted" noOfLines={3} overflowWrap="anywhere">
          “{quote}”
        </Text>
      )}
      <Flex align="center" gap={2} mt="auto" wrap="wrap">
        <Box flex="1" minW="96px">
          <Text textStyle="display" fontSize="lg" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {price}
          </Text>
          {priceCaption && (
            <Text fontSize="xs" color="fg.muted">
              {priceCaption}
            </Text>
          )}
        </Box>
        {actions}
      </Flex>
    </Flex>
  </Flex>
);
