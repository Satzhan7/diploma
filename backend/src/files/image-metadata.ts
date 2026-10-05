import { ImageType } from './image-type';

/**
 * Removes metadata that can identify a person (EXIF with GPS and camera
 * serials, XMP, IPTC, comments, text chunks) without decoding the image.
 * Portfolio images are public, and phone photos carry the GPS position.
 * Returns null when the file's structure is broken; such files are refused.
 */
export function stripImageMetadata(
  data: Buffer,
  type: ImageType,
): Buffer | null {
  switch (type.ext) {
    case 'jpg':
      return stripJpeg(data);
    case 'png':
      return stripPng(data);
    case 'webp':
      return stripWebp(data);
  }
}

// JPEG: keep APP0 (JFIF), APP2 (ICC colour profile) and APP14 (Adobe colour
// transform); drop APP1 (EXIF, XMP), the other APPn, and comments.
const JPEG_DROP = new Set([
  0xe1, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xef,
  0xfe,
]);

function stripJpeg(data: Buffer): Buffer | null {
  const parts: Buffer[] = [data.subarray(0, 2)];
  let pos = 2;
  while (pos + 4 <= data.length) {
    if (data[pos] !== 0xff) return null;
    const marker = data[pos + 1];
    if (marker === 0xff) {
      pos += 1; // fill byte
      continue;
    }
    if (
      marker === 0xd8 ||
      (marker >= 0xd0 && marker <= 0xd7) ||
      marker === 0x01
    ) {
      parts.push(data.subarray(pos, pos + 2));
      pos += 2;
      continue;
    }
    if (marker === 0xd9) {
      parts.push(data.subarray(pos, pos + 2));
      return Buffer.concat(parts);
    }
    const end = pos + 2 + data.readUInt16BE(pos + 2);
    if (end > data.length) return null;
    // Start of scan: the entropy-coded image follows to the end; keep it as is.
    if (marker === 0xda) {
      parts.push(data.subarray(pos));
      return Buffer.concat(parts);
    }
    if (!JPEG_DROP.has(marker)) parts.push(data.subarray(pos, end));
    pos = end;
  }
  return null;
}

const PNG_DROP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);

function stripPng(data: Buffer): Buffer | null {
  const parts: Buffer[] = [data.subarray(0, 8)];
  let pos = 8;
  while (pos + 12 <= data.length) {
    const length = data.readUInt32BE(pos);
    const type = data.toString('latin1', pos + 4, pos + 8);
    const end = pos + 12 + length;
    if (end > data.length) return null;
    if (!PNG_DROP.has(type)) parts.push(data.subarray(pos, end));
    pos = end;
    if (type === 'IEND') return Buffer.concat(parts);
  }
  return null;
}

const WEBP_DROP = new Set(['EXIF', 'XMP ']);
const VP8X_EXIF = 0x08;
const VP8X_XMP = 0x04;

function stripWebp(data: Buffer): Buffer | null {
  if (data.length < 12) return null;
  const end = 8 + data.readUInt32LE(4);
  if (end > data.length) return null;
  const chunks: Buffer[] = [];
  let pos = 12;
  while (pos + 8 <= end) {
    const fourcc = data.toString('latin1', pos, pos + 4);
    const size = data.readUInt32LE(pos + 4);
    const next = pos + 8 + size + (size % 2);
    if (pos + 8 + size > end) return null;
    if (!WEBP_DROP.has(fourcc)) {
      const chunk = Buffer.from(data.subarray(pos, Math.min(next, end)));
      if (fourcc === 'VP8X' && size >= 1) chunk[8] &= ~(VP8X_EXIF | VP8X_XMP);
      chunks.push(chunk);
    }
    pos = next;
  }
  if (pos < end) return null;
  const body = Buffer.concat(chunks);
  const header = Buffer.from(data.subarray(0, 12));
  header.writeUInt32LE(4 + body.length, 4);
  return Buffer.concat([header, body]);
}
