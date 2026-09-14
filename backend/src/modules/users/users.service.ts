import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

export const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByIdWithPassword(id: string) {
    return this.prisma.user.findFirst({
      where: { id, status: UserStatus.ACTIVE, deletedAt: null },
    });
  }

  findPublicById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: publicUserSelect,
    });
  }

  findActiveById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findFirst({
      where: { id, status: UserStatus.ACTIVE, deletedAt: null },
      select: publicUserSelect,
    });
  }

  create(data: Prisma.UserCreateInput): Promise<PublicUser> {
    return this.prisma.user.create({ data, select: publicUserSelect });
  }

  async findAll(query: QueryUsersDto): Promise<PaginatedResult<PublicUser>> {
    const where = this.createListWhere(query);
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  findAgents(query: QueryUsersDto): Promise<PaginatedResult<PublicUser>> {
    return this.findAll({ ...query, role: 'AGENT' });
  }

  async getById(id: string): Promise<PublicUser> {
    const user = await this.findPublicById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    await this.getById(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: publicUserSelect,
    });
  }

  async updateRole(
    actorId: string,
    id: string,
    dto: UpdateUserRoleDto,
  ): Promise<PublicUser> {
    this.assertDifferentUser(actorId, id, 'change your own role');
    await this.getById(id);
    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { role: dto.role },
        select: publicUserSelect,
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return user;
  }

  async updateStatus(
    actorId: string,
    id: string,
    dto: UpdateUserStatusDto,
  ): Promise<PublicUser> {
    this.assertDifferentUser(actorId, id, 'change your own status');
    await this.getById(id);
    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { status: dto.status },
        select: publicUserSelect,
      }),
      ...(dto.status === UserStatus.BLOCKED
        ? [
            this.prisma.refreshToken.updateMany({
              where: { userId: id, revokedAt: null },
              data: { revokedAt: new Date() },
            }),
          ]
        : []),
    ]);

    return user;
  }

  async softDelete(actorId: string, id: string): Promise<PublicUser> {
    this.assertDifferentUser(actorId, id, 'delete your own account');
    await this.getById(id);
    const deletedAt = new Date();
    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt, status: UserStatus.BLOCKED },
        select: publicUserSelect,
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: deletedAt },
      }),
    ]);

    return user;
  }

  private createListWhere(query: QueryUsersDto): Prisma.UserWhereInput {
    const search = query.search?.trim();

    return {
      deletedAt: null,
      role: query.role,
      status: query.status,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private assertDifferentUser(
    actorId: string,
    targetId: string,
    action: string,
  ): void {
    if (actorId === targetId) {
      throw new BadRequestException(`You cannot ${action}`);
    }
  }
}
