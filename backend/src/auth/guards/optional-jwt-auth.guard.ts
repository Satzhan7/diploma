import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Lets the request through with or without a valid access token; `req.user`
 * is the claims object or null. The handler decides what an anonymous
 * caller may see.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(_err: unknown, user: T | false): T | null {
    return user || null;
  }
}
