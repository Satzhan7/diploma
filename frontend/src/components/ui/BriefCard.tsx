import React from 'react';
import { Avatar, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { layout } from '../../theme';

interface BriefCardProps {
  /** Brand on a brief; the other side on a deal. */
  partyName: string;
  partyAvatarUrl?: string | null;
  partyCaption?: string | null;
  /** Top-right label, e.g. a StatusPill or "17h left". */
  badge?: React.ReactNode;
  title: string;
  chips?: string[];
  amount: React.ReactNode;
  amountCaption?: React.ReactNode;
  /** Main action (Apply, Open). */
  action?: React.ReactNode;
}

/** Brief/deal summary card from the mockup's creator feed. */
export const BriefCard: React.FC<BriefCardProps> = ({
  partyName,
  partyAvatarUrl,
  partyCaption,
  badge,
  title,
  chips = [],
  amount,
  amountCaption,
  action,
}) => (
  <Flex as="article" layerStyle="card" p={layout.card} direction="column" gap={3} minW={0}>
    <HStack spacing={3} align="center">
      <Avatar
        size="sm"
        name={partyName}
        src={partyAvatarUrl ?? undefined}
        bg="primary.soft"
        color="primary.ink"
        fontWeight="700"
      />
      <Box flex="1" minW={0}>
        <Text fontWeight="600" fontSize="sm" noOfLines={1}>
          {partyName}
        </Text>
        {partyCaption && (
          <Text fontSize="xs" color="fg.muted" noOfLines={1}>
            {partyCaption}
          </Text>
        )}
      </Box>
      {badge}
    </HStack>

    <Text as="h3" textStyle="h3" overflowWrap="anywhere">
      {title}
    </Text>

    {chips.length > 0 && (
      <HStack spacing={1.5} wrap="wrap">
        {chips.map((chip) => (
          <Box
            key={chip}
            as="span"
            h={6}
            px={2.5}
            borderRadius="full"
            bg="bg.subtle"
            fontSize="xs"
            fontWeight="500"
            display="inline-flex"
            alignItems="center"
          >
            {chip}
          </Box>
        ))}
      </HStack>
    )}

    <Flex align="center" gap={3} mt="auto" pt={1}>
      <Box flex="1" minW={0}>
        <Text textStyle="h2">{amount}</Text>
        {amountCaption && (
          <Text fontSize="xs" color="fg.muted">
            {amountCaption}
          </Text>
        )}
      </Box>
      {action}
    </Flex>
  </Flex>
);
