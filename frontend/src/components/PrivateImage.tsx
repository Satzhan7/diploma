import React, { useEffect, useState } from 'react';
import { Box, BoxProps, Image, Skeleton, Text } from '@chakra-ui/react';
import { filesService } from '../services/files';

interface PrivateImageProps extends BoxProps {
  fileId: string;
  alt: string;
  errorText: string;
}

/**
 * An owner/admin-only image: fetched with the access token (an `<img src>`
 * cannot send it) and shown from an object URL, revoked on unmount.
 */
export const PrivateImage: React.FC<PrivateImageProps> = ({ fileId, alt, errorText, ...props }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let created: string | null = null;
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    filesService
      .objectUrl(fileId)
      .then((objectUrl) => {
        if (cancelled) URL.revokeObjectURL(objectUrl);
        else setUrl((created = objectUrl));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [fileId]);

  return (
    <Box borderRadius="md" overflow="hidden" bg="bg.subtle" {...props}>
      {failed ? (
        <Text p={4} fontSize="sm" color="fg.muted" role="status">
          {errorText}
        </Text>
      ) : url ? (
        <Image src={url} alt={alt} objectFit="contain" w="full" h="full" />
      ) : (
        <Skeleton w="full" h="full" minH="200px" />
      )}
    </Box>
  );
};
