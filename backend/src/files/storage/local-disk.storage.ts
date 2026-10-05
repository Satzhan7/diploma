import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, open, rm, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { Readable } from 'stream';
import { StorageService } from './storage.service';

const KEY_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export function newStorageKey(ext: 'jpg' | 'png' | 'webp'): string {
  return `${randomUUID()}.${ext}`;
}

/**
 * Files in one flat private directory (a Docker volume). Keys are checked
 * against the generated pattern, so no key can walk out of the directory.
 */
@Injectable()
export class LocalDiskStorage extends StorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    super();
    this.root = resolve(config.get<string>('uploadDir'));
  }

  private pathOf(key: string): string {
    if (!KEY_PATTERN.test(key)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return join(this.root, key);
  }

  async put(key: string, data: Buffer): Promise<void> {
    const path = this.pathOf(key);
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    // `wx`: never overwrite an existing file.
    await writeFile(path, data, { flag: 'wx', mode: 0o600 });
  }

  async read(key: string): Promise<Readable> {
    const path = this.pathOf(key);
    // Open first so a missing file rejects here, not mid-response.
    const handle = await open(path, 'r');
    return handle.createReadStream();
  }

  async remove(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true });
  }
}
