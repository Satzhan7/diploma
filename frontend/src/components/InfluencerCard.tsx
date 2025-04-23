import React from 'react';
import { Box, Text, Card, CardBody, Heading, Button, Avatar, HStack, VStack, Badge } from '@chakra-ui/react';
// Removed User import as we only need specific fields

// Define a type for the expected influencer data structure
interface CardInfluencer {
  id: string;
  name: string;
  avatarUrl?: string; // Optional
  bio?: string;       // Optional
  categories?: string[]; // Optional
}

interface InfluencerCardProps {
  influencer: CardInfluencer; // Use the specific type
  onSelect: (influencerId: string) => void;
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({ influencer, onSelect }) => {
  return (
    <Card borderWidth="1px" borderRadius="lg" overflow="hidden">
      <CardBody>
        <HStack spacing={4}>
          <Avatar name={influencer.name} src={influencer.avatarUrl} />
          <VStack align="start">
            <Heading size="md">{influencer.name}</Heading>
            <Text noOfLines={2}>{influencer.bio || 'No bio available'}</Text>
            <HStack>
              {influencer.categories?.slice(0, 3).map((cat: string) => <Badge key={cat}>{cat}</Badge>)}
            </HStack>
             <Button size="sm" onClick={() => onSelect(influencer.id)}>Select</Button>
          </VStack>
        </HStack>
      </CardBody>
    </Card>
  );
};

export default InfluencerCard; 