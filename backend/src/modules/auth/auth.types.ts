import { PublicUser } from '../users/users.service';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenMaxAge: number;
  user: PublicUser;
}

export type AuthResponse = Omit<
  AuthResult,
  'refreshToken' | 'refreshTokenMaxAge'
>;

export interface ForgotPasswordResult {
  message: string;
}
