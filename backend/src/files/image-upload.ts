import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { MAX_IMAGE_BYTES } from './files.service';

/**
 * One image in the multipart field `file`, held in memory (5 MB at most) so
 * its bytes can be checked before anything touches the disk. Multer's size
 * error becomes 413 PAYLOAD_TOO_LARGE. nginx allows 6 MB on these routes.
 */
export const ImageUpload = () =>
  applyDecorators(
    Throttle({ default: { limit: 20, ttl: 60_000 } }),
    UseInterceptors(
      FileInterceptor('file', {
        limits: {
          fileSize: MAX_IMAGE_BYTES,
          files: 1,
          fields: 10,
          fieldSize: 1024,
          parts: 12,
        },
      }),
    ),
  );
