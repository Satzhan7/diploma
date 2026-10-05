import { stripImageMetadata } from './image-metadata';
import { detectImageType } from './image-type';

const seg = (marker: number, payload: Buffer) => {
  const head = Buffer.alloc(4);
  head[0] = 0xff;
  head[1] = marker;
  head.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([head, payload]);
};
const strip = (data: Buffer) =>
  stripImageMetadata(data, detectImageType(data)!);

describe('stripImageMetadata', () => {
  it('drops EXIF (GPS) and comments from a JPEG and keeps JFIF, ICC and the scan', () => {
    const jfif = seg(0xe0, Buffer.from('JFIF\0\x01\x01'));
    const exif = seg(0xe1, Buffer.from('Exif\0\0GPS 43.2389N 76.8897E'));
    const icc = seg(0xe2, Buffer.from('ICC_PROFILE\0'));
    const comment = seg(0xfe, Buffer.from('shot on my phone'));
    const sos = Buffer.concat([
      seg(0xda, Buffer.from([1, 2, 3])),
      Buffer.from([9, 9, 0xff, 0xd9]),
    ]);
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      jfif,
      exif,
      icc,
      comment,
      sos,
    ]);
    const out = strip(jpeg)!;
    expect(out.includes(Buffer.from('GPS'))).toBe(false);
    expect(out.includes(Buffer.from('shot on my phone'))).toBe(false);
    expect(out).toEqual(
      Buffer.concat([Buffer.from([0xff, 0xd8]), jfif, icc, sos]),
    );
  });

  it('drops text and EXIF chunks from a PNG', () => {
    const chunk = (type: string, body: string) => {
      const length = Buffer.alloc(4);
      length.writeUInt32BE(body.length);
      return Buffer.concat([
        length,
        Buffer.from(type, 'latin1'),
        Buffer.from(body),
        Buffer.alloc(4),
      ]);
    };
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = chunk('IHDR', '1234567890123');
    const idat = chunk('IDAT', 'pixels');
    const iend = chunk('IEND', '');
    const png = Buffer.concat([
      sig,
      ihdr,
      chunk('tEXt', 'Author\0Aruzhan'),
      chunk('eXIf', 'GPS'),
      idat,
      iend,
    ]);
    expect(strip(png)).toEqual(Buffer.concat([sig, ihdr, idat, iend]));
  });

  it('drops EXIF and XMP from a WebP, fixes the RIFF size and the VP8X flags', () => {
    const chunk = (fourcc: string, body: Buffer) => {
      const size = Buffer.alloc(4);
      size.writeUInt32LE(body.length);
      return Buffer.concat([
        Buffer.from(fourcc, 'latin1'),
        size,
        body,
        body.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0),
      ]);
    };
    const vp8x = chunk('VP8X', Buffer.from([0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    const image = chunk('VP8L', Buffer.from([1, 2, 3, 4]));
    const riff = (body: Buffer) => {
      const head = Buffer.from('RIFF....WEBP', 'latin1');
      head.writeUInt32LE(4 + body.length, 4);
      return Buffer.concat([head, body]);
    };
    const webp = riff(
      Buffer.concat([
        vp8x,
        image,
        chunk('EXIF', Buffer.from('GPS!!')),
        chunk('XMP ', Buffer.from('<x/>')),
      ]),
    );
    const out = strip(webp)!;
    expect(out.includes(Buffer.from('GPS'))).toBe(false);
    expect(out.readUInt32LE(4)).toBe(out.length - 8);
    expect(out[20] & 0x0c).toBe(0);
    expect(out.subarray(30)).toEqual(image);
  });

  it('refuses broken structures', () => {
    expect(strip(Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff]))).toBeNull();
    expect(
      strip(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 99,
        ]),
      ),
    ).toBeNull();
    const webp = Buffer.from('RIFF\xff\xff\x00\x00WEBP', 'latin1');
    expect(strip(webp)).toBeNull();
  });
});
