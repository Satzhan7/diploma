import { Readable } from 'stream';

/**
 * Where uploaded bytes live (decision D4). Keys come from
 * `newStorageKey()` only. Local disk now; an S3-compatible KZ provider
 * later implements the same three calls.
 */
export abstract class StorageService {
  abstract put(key: string, data: Buffer): Promise<void>;
  /** Rejects when the key does not exist. */
  abstract read(key: string): Promise<Readable>;
  /** Succeeds when the key is already gone. */
  abstract remove(key: string): Promise<void>;
}
