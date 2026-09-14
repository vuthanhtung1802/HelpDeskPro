import { UserRole } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenType: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  nonce: string;
  tokenType: 'refresh';
}
