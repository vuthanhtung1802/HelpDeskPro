import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicUser, UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';

const now = new Date('2026-09-03T00:00:00.000Z');
const publicUser: PublicUser = {
  id: '96bc46cd-8d50-4dcb-85d8-b5a27472730b',
  email: 'user@example.com',
  fullName: 'Example User',
  avatarUrl: null,
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  createdAt: now,
  updatedAt: now,
};

describe('AuthService', () => {
  const createRefreshToken = jest.fn<
    Promise<unknown>,
    [{ data: { tokenHash: string } }]
  >();
  const refreshTokenRepository = {
    create: createRefreshToken,
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const userRepository = {
    update: jest.fn(),
  };
  const passwordResetTokenRepository = {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  };
  const transaction = jest.fn();
  const prisma = {
    refreshToken: refreshTokenRepository,
    passwordResetToken: passwordResetTokenRepository,
    user: userRepository,
    $transaction: transaction,
  } as unknown as PrismaService;
  const usersService = {
    findByEmailWithPassword: jest.fn(),
    findByIdWithPassword: jest.fn(),
    findActiveById: jest.fn(),
    create: jest.fn(),
  } as unknown as UsersService;
  const jwtService = {
    signAsync: jest.fn((payload: { tokenType: string }): Promise<string> =>
      Promise.resolve(
        payload.tokenType === 'access' ? 'access-token' : 'refresh-token',
      ),
    ),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const configValues: Record<string, string> = {
    NODE_ENV: 'test',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    JWT_REFRESH_EXPIRES_IN: '7d',
  };
  const config = {
    getOrThrow: jest.fn((key: string): string => configValues[key] ?? ''),
  } as unknown as ConfigService;
  const mailService = {
    isEnabled: jest.fn().mockReturnValue(true),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  } as unknown as MailService;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma,
      usersService,
      jwtService,
      config,
      mailService,
    );
  });

  it('registers a user with a hashed password and stored refresh token hash', async () => {
    let createdUserData: Prisma.UserCreateInput | undefined;
    let storedRefreshHash = '';
    jest.mocked(usersService.findByEmailWithPassword).mockResolvedValue(null);
    jest.mocked(usersService.create).mockImplementation((data) => {
      createdUserData = data;
      return Promise.resolve(publicUser);
    });
    createRefreshToken.mockImplementation(({ data }) => {
      storedRefreshHash = data.tokenHash;
      return Promise.resolve({});
    });

    const result = await service.register({
      email: publicUser.email,
      fullName: publicUser.fullName,
      password: 'StrongPass@123',
    });

    expect(createdUserData?.email).toBe(publicUser.email);
    expect(
      await bcrypt.compare(
        'StrongPass@123',
        createdUserData?.passwordHash ?? '',
      ),
    ).toBe(true);
    expect(await bcrypt.compare('refresh-token', storedRefreshHash)).toBe(true);
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: publicUser,
    });
  });

  it('rejects an email that is already registered', async () => {
    jest.mocked(usersService.findByEmailWithPassword).mockResolvedValue({
      ...publicUser,
      passwordHash: 'existing-hash',
      deletedAt: null,
    });

    await expect(
      service.register({
        email: publicUser.email,
        fullName: publicUser.fullName,
        password: 'StrongPass@123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a blocked account even when its password is valid', async () => {
    const passwordHash = await bcrypt.hash('StrongPass@123', 4);
    jest.mocked(usersService.findByEmailWithPassword).mockResolvedValue({
      ...publicUser,
      status: UserStatus.BLOCKED,
      passwordHash,
      deletedAt: null,
    });

    await expect(
      service.login({
        email: publicUser.email,
        password: 'StrongPass@123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates a valid refresh token', async () => {
    const oldRefreshToken = 'old-refresh-token';
    const tokenHash = await bcrypt.hash(oldRefreshToken, 4);
    jest.mocked(jwtService.verifyAsync).mockResolvedValue({
      sub: publicUser.id,
      tokenId: '5d89d944-ea90-4010-8710-ddffce07f30d',
      nonce: 'nonce',
      tokenType: 'refresh',
    });
    refreshTokenRepository.findUnique.mockResolvedValue({
      id: '5d89d944-ea90-4010-8710-ddffce07f30d',
      userId: publicUser.id,
      tokenHash,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { ...publicUser, passwordHash: 'hidden', deletedAt: null },
    });
    jest.mocked(usersService.findActiveById).mockResolvedValue(publicUser);
    refreshTokenRepository.update.mockResolvedValue({});

    const result = await service.refresh(oldRefreshToken);

    expect(result.refreshToken).toBe('refresh-token');
    expect(refreshTokenRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '5d89d944-ea90-4010-8710-ddffce07f30d' },
      }),
    );
  });

  it('changes the password and revokes every active refresh token', async () => {
    const passwordHash = await bcrypt.hash('CurrentPass@123', 4);
    jest.mocked(usersService.findByIdWithPassword).mockResolvedValue({
      ...publicUser,
      passwordHash,
      deletedAt: null,
    });
    userRepository.update.mockResolvedValue({});
    refreshTokenRepository.updateMany.mockResolvedValue({ count: 2 });
    transaction.mockResolvedValue([]);

    await service.changePassword(publicUser.id, {
      currentPassword: 'CurrentPass@123',
      newPassword: 'NewStrongPass@456',
    });

    expect(userRepository.update).toHaveBeenCalled();
    expect(refreshTokenRepository.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: publicUser.id, revokedAt: null },
      }),
    );
    expect(transaction).toHaveBeenCalled();
  });

  it('stores only a hash when creating a password reset token', async () => {
    let storedTokenHash = '';
    jest.mocked(usersService.findByEmailWithPassword).mockResolvedValue({
      ...publicUser,
      passwordHash: 'password-hash',
      deletedAt: null,
    });
    passwordResetTokenRepository.updateMany.mockResolvedValue({ count: 0 });
    passwordResetTokenRepository.create.mockImplementation(
      (input: { data: { tokenHash: string } }) => {
        storedTokenHash = input.data.tokenHash;
        return Promise.resolve({});
      },
    );
    transaction.mockResolvedValue([]);

    const result = await service.forgotPassword({ email: publicUser.email });

    expect(result).toEqual({
      message:
        'If the account exists, password reset instructions have been created',
    });
    expect(storedTokenHash).toMatch(/^\$2[aby]\$/);
    expect(storedTokenHash).toHaveLength(60);
    expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
      publicUser.email,
      expect.stringMatching(/^[^.]+\.[a-f0-9]{64}$/),
    );
  });

  it('does not create a reset token when email delivery is disabled', async () => {
    jest.mocked(usersService.findByEmailWithPassword).mockResolvedValue({
      ...publicUser,
      passwordHash: 'password-hash',
      deletedAt: null,
    });
    jest.mocked(mailService.isEnabled).mockReturnValueOnce(false);

    await service.forgotPassword({ email: publicUser.email });

    expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
    expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects an invalid password reset token', async () => {
    passwordResetTokenRepository.findUnique.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: '5d89d944-ea90-4010-8710-ddffce07f30d.a'.padEnd(101, 'a'),
        newPassword: 'NewStrongPass@456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses a reset token once, updates the password and revokes sessions', async () => {
    const tokenId = '5d89d944-ea90-4010-8710-ddffce07f30d';
    const secret = 'a'.repeat(64);
    const tokenHash = await bcrypt.hash(secret, 4);
    passwordResetTokenRepository.findUnique.mockResolvedValue({
      id: tokenId,
      userId: publicUser.id,
      tokenHash,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { ...publicUser, passwordHash: 'old-hash', deletedAt: null },
    });
    const transactionClient = {
      passwordResetToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
      refreshToken: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => Promise<void>) =>
        callback(transactionClient),
    );

    await service.resetPassword({
      token: `${tokenId}.${secret}`,
      newPassword: 'NewStrongPass@456',
    });

    expect(transactionClient.passwordResetToken.updateMany).toHaveBeenCalled();
    expect(transactionClient.user.update).toHaveBeenCalled();
    expect(transactionClient.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: publicUser.id, revokedAt: null },
      }),
    );
  });
});
