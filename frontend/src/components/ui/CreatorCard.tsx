import React from 'react';
import { Avatar, Box, Flex, HStack, Image, SimpleGrid, Text } from '@chakra-ui/react';
import { FiImage } from 'react-icons/fi';
import { ScoreRing } from './ScoreRing';
import { VerifiedBadge } from './VerifiedBadge';
import { layout } from '../../theme';

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
  /** Label of the content strip. */
  stripLabel: string;
  /** Portfolio images; the strip shows the first three, placeholders without any. */
  images?: { src: string; alt: string }[];
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
  images = [],
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
    <HStack spacing={3} p={layout.card} pb={3}>
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

    {images.length ? (
      <SimpleGrid columns={3} spacing={1} px={layout.card} as="ul" listStyleType="none" aria-label={stripLabel}>
        {images.slice(0, 3).map((image) => (
          <Box as="li" key={image.src} aspectRatio={4 / 5} borderRadius="md" overflow="hidden" bg="bg.subtle">
            <Image src={image.src} alt={image.alt} loading="lazy" objectFit="cover" w="full" h="full" />
          </Box>
        ))}
      </SimpleGrid>
    ) : (
      <SimpleGrid columns={3} spacing={1} px={layout.card} role="img" aria-label={stripLabel}>
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
    )}

    <Flex direction="column" gap={3} p={layout.card} pt={3} flex="1">
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
        <Box flex="1" minW={24}>
          <Text textStyle="h3" sx={{ fontVariantNumeric: 'tabular-nums' }}>
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
