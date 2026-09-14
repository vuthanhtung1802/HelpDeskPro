import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Prisma, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicUser, UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { AuthResult, ForgotPasswordResult } from './auth.types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const PASSWORD_HASH_ROUNDS = 12;
const PASSWORD_RESET_LIFETIME_MS = 15 * 60 * 1_000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.usersService.findByEmailWithPassword(
      dto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_ROUNDS);
    let user: PublicUser;
    try {
      user = await this.usersService.create({
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }

    return this.createSession(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE || user.deletedAt) {
      throw new UnauthorizedException('Account is not active');
    }

    const publicUser = await this.usersService.findActiveById(user.id);
    if (!publicUser) {
      throw new UnauthorizedException('Account is not active');
    }

    return this.createSession(publicUser);
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findActiveById(userId);
    if (!user) {
      throw new UnauthorizedException('Account is not active');
    }

    return user;
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.user.status !== UserStatus.ACTIVE ||
      storedToken.user.deletedAt
    ) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      storedToken.tokenHash,
    );
    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.usersService.findActiveById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('Account is not active');
    }

    return this.rotateSession(user, storedToken.id);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: {
          id: payload.tokenId,
          userId: payload.sub,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } catch {
      return;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (
      !user ||
      !(await bcrypt.compare(dto.currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      PASSWORD_HASH_ROUNDS,
    );
    const revokedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt },
      }),
    ]);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const tokenId = randomUUID();
    const secret = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(secret, PASSWORD_HASH_ROUNDS);

    if (
      user &&
      user.status === UserStatus.ACTIVE &&
      !user.deletedAt &&
      this.mailService.isEnabled()
    ) {
      await this.prisma.$transaction([
        this.prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        this.prisma.passwordResetToken.create({
          data: {
            id: tokenId,
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + PASSWORD_RESET_LIFETIME_MS),
          },
        }),
      ]);

      try {
        await this.mailService.sendPasswordReset(
          user.email,
          `${tokenId}.${secret}`,
        );
      } catch {
        await this.prisma.passwordResetToken.updateMany({
          where: { id: tokenId, usedAt: null },
          data: { usedAt: new Date() },
        });
      }
    }

    return {
      message:
        'If the account exists, password reset instructions have been created',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const [tokenId, secret] = dto.token.split('.');
    if (!tokenId || !secret) {
      throw new BadRequestException(
        'Password reset token is invalid or expired',
      );
    }

    const storedToken = await this.prisma.passwordResetToken.findUnique({
      where: { id: tokenId },
      include: { user: true },
    });
    const isValid =
      storedToken &&
      !storedToken.usedAt &&
      storedToken.expiresAt > new Date() &&
      storedToken.user.status === UserStatus.ACTIVE &&
      !storedToken.user.deletedAt &&
      (await bcrypt.compare(secret, storedToken.tokenHash));

    if (!storedToken || !isValid) {
      throw new BadRequestException(
        'Password reset token is invalid or expired',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      PASSWORD_HASH_ROUNDS,
    );
    const changedAt = new Date();

    await this.prisma.$transaction(async (transaction) => {
      const claimedToken = await transaction.passwordResetToken.updateMany({
        where: {
          id: storedToken.id,
          usedAt: null,
          expiresAt: { gt: changedAt },
        },
        data: { usedAt: changedAt },
      });
      if (claimedToken.count !== 1) {
        throw new BadRequestException(
          'Password reset token is invalid or expired',
        );
      }

      await transaction.user.update({
        where: { id: storedToken.userId },
        data: { passwordHash },
      });
      await transaction.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: changedAt },
      });
    });
  }

  private async createSession(user: PublicUser): Promise<AuthResult> {
    const tokenId = randomUUID();
    const session = await this.buildSession(user, tokenId);

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: await bcrypt.hash(
          session.refreshToken,
          PASSWORD_HASH_ROUNDS,
        ),
        expiresAt: new Date(Date.now() + session.refreshTokenMaxAge),
      },
    });

    return session;
  }

  private async rotateSession(
    user: PublicUser,
    tokenId: string,
  ): Promise<AuthResult> {
    const session = await this.buildSession(user, tokenId);

    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        tokenHash: await bcrypt.hash(
          session.refreshToken,
          PASSWORD_HASH_ROUNDS,
        ),
        expiresAt: new Date(Date.now() + session.refreshTokenMaxAge),
      },
    });

    return session;
  }

  private async buildSession(
    user: PublicUser,
    tokenId: string,
  ): Promise<AuthResult> {
    const accessExpiresIn = this.config.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    );
    const refreshExpiresIn = this.config.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'access',
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenId,
      nonce: randomUUID(),
      tokenType: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
      }),
    ]);

    return {
      user,
      accessToken,
      refreshToken,
      refreshTokenMaxAge: this.durationToMilliseconds(refreshExpiresIn),
    };
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET') },
      );

      if (
        payload.tokenType !== 'refresh' ||
        !payload.sub ||
        !payload.tokenId ||
        !payload.nonce
      ) {
        throw new Error('Invalid refresh token payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  private durationToMilliseconds(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) {
      throw new Error(`Invalid token duration: ${duration}`);
    }

    const value = Number(match[1]);
    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    const multiplier = multipliers[match[2]];

    if (!multiplier) {
      throw new Error(`Invalid token duration: ${duration}`);
    }

    return value * multiplier;
  }
}
