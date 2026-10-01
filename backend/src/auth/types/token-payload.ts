export type TokenType = 'access' | 'refresh';

export interface TokenPayload {
  sub: string;
  email: string;
  tokenType: TokenType;
}
