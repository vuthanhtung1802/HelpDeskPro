import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicUser, UsersService } from './users.service';

const user: PublicUser = {
  id: '96bc46cd-8d50-4dcb-85d8-b5a27472730b',
  email: 'user@example.com',
  fullName: 'Example User',
  avatarUrl: null,
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  createdAt: new Date('2026-09-03T00:00:00.000Z'),
  updatedAt: new Date('2026-09-03T00:00:00.000Z'),
};

describe('UsersService', () => {
  const userRepository = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };
  const refreshTokenRepository = {
    updateMany: jest.fn(),
  };
  const transaction = jest.fn();
  const prisma = {
    user: userRepository,
    refreshToken: refreshTokenRepository,
    $transaction: transaction,
  } as unknown as PrismaService;

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma);
  });

  it('paginates active users and applies the supplied search filter', async () => {
    let receivedArgs: Prisma.UserFindManyArgs | undefined;
    userRepository.findMany.mockImplementation(
      (args: Prisma.UserFindManyArgs) => {
        receivedArgs = args;
        return Promise.resolve([user]);
      },
    );
    userRepository.count.mockResolvedValue(1);
    transaction.mockResolvedValue([[user], 1]);

    const result = await service.findAll({
      page: 2,
      limit: 5,
      search: 'example',
      status: UserStatus.ACTIVE,
    });

    expect(result).toEqual({
      data: [user],
      meta: { page: 2, limit: 5, total: 1, totalPages: 1 },
    });
    expect(receivedArgs?.skip).toBe(5);
    expect(receivedArgs?.take).toBe(5);
    expect(receivedArgs?.where).toMatchObject({
      deletedAt: null,
      status: UserStatus.ACTIVE,
    });
  });

  it('does not allow an admin to change their own role', async () => {
    await expect(
      service.updateRole(user.id, user.id, { role: UserRole.ADMIN }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revokes active sessions after a role change', async () => {
    userRepository.findFirst.mockResolvedValue(user);
    userRepository.update.mockResolvedValue({ ...user, role: UserRole.AGENT });
    refreshTokenRepository.updateMany.mockResolvedValue({ count: 1 });
    transaction.mockResolvedValue([
      { ...user, role: UserRole.AGENT },
      { count: 1 },
    ]);

    const result = await service.updateRole('admin-id', user.id, {
      role: UserRole.AGENT,
    });

    expect(result.role).toBe(UserRole.AGENT);
    expect(refreshTokenRepository.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: user.id, revokedAt: null },
      }),
    );
  });

  it('revokes active sessions when an admin blocks a user', async () => {
    userRepository.findFirst.mockResolvedValue(user);
    userRepository.update.mockResolvedValue({
      ...user,
      status: UserStatus.BLOCKED,
    });
    refreshTokenRepository.updateMany.mockResolvedValue({ count: 1 });
    transaction.mockResolvedValue([
      { ...user, status: UserStatus.BLOCKED },
      { count: 1 },
    ]);

    const result = await service.updateStatus('admin-id', user.id, {
      status: UserStatus.BLOCKED,
    });

    expect(result.status).toBe(UserStatus.BLOCKED);
    expect(refreshTokenRepository.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: user.id, revokedAt: null },
      }),
    );
  });

  it('returns not found when the user does not exist', async () => {
    userRepository.findFirst.mockResolvedValue(null);

    await expect(service.getById(user.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
