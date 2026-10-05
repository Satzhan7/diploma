import { InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import * as classTransformer from 'class-transformer';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  it('fails closed instead of returning raw entities when serialisation throws', async () => {
    jest.spyOn(classTransformer, 'instanceToPlain').mockImplementation(() => {
      throw new Error('boom');
    });
    const raw = { id: 'u1', password: '$2b$10$hash' };

    await expect(
      lastValueFrom(
        new TransformInterceptor().intercept({} as any, {
          handle: () => of(raw),
        }),
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('passes a StreamableFile through untouched', async () => {
    const file = new StreamableFile(Buffer.from('x'));
    await expect(
      lastValueFrom(
        new TransformInterceptor().intercept({} as any, {
          handle: () => of(file),
        }),
      ),
    ).resolves.toBe(file);
  });
});
