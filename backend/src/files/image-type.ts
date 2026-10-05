export interface ImageType {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  ext: 'jpg' | 'png' | 'webp';
}

const startsWith = (data: Buffer, bytes: number[], offset = 0) =>
  data.length >= offset + bytes.length &&
  bytes.every((byte, i) => data[offset + i] === byte);

/**
 * The image type from the file's first bytes. The client's Content-Type and
 * file name are ignored: they are whatever the uploader says.
 */
export function detectImageType(data: Buffer): ImageType | null {
  if (startsWith(data, [0xff, 0xd8, 0xff])) {
    return { mimeType: 'image/jpeg', ext: 'jpg' };
  }
  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: 'image/png', ext: 'png' };
  }
  // RIFF <size> WEBP
  if (
    startsWith(data, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(data, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { mimeType: 'image/webp', ext: 'webp' };
  }
  return null;
}
