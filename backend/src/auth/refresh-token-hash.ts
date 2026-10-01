import { createHash, timingSafeEqual } from 'crypto';

// Refresh tokens are stored as SHA-256 digests, not bcrypt. bcrypt reads only
// the first 72 bytes, which for our JWTs is the header plus part of the `sub`
// claim, so every refresh token issued to a user matched the same hash and
// rotation never revoked the old token. The tokens are long random-signed
// JWTs, so a fast hash is enough here; passwords keep using bcrypt.
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshTokenMatches(token: string, stored: string): boolean {
  const actual = Buffer.from(hashRefreshToken(token), 'hex');
  const expected = Buffer.from(stored, 'hex');
  // Legacy bcrypt values decode to a different length and never match, so
  // those users simply log in again.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
