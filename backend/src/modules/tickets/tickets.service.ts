import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Prisma,
  TicketStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

export const ticketSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  resolvedAt: true,
  closedAt: true,
  dueAt: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, fullName: true, email: true, avatarUrl: true },
  },
  assignee: {
    select: { id: true, fullName: true, email: true, avatarUrl: true },
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
  rating: {
    select: {
      id: true,
      score: true,
      comment: true,
      createdAt: true,
      agent: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.TicketSelect;

export type Ticket = Prisma.TicketGetPayload<{ select: typeof ticketSelect }>;

const historySelect = {
  id: true,
  action: true,
  field: true,
  oldValue: true,
  newValue: true,
  createdAt: true,
  actor: {
    select: { id: true, fullName: true, email: true, avatarUrl: true },
  },
} satisfies Prisma.TicketHistorySelect;

type MutableTicket = {
  id: string;
  creatorId: string;
  assigneeId: string | null;
  categoryId: string;
  title: string;
  description: string;
  priority: string;
  status: TicketStatus;
};

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(creatorId: string, dto: CreateTicketDto): Promise<Ticket> {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const committed = await this.prisma.$transaction(async (transaction) => {
      const year = new Date().getUTCFullYear();
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(${year})`;
      const latest = await transaction.ticket.findFirst({
        where: { code: { startsWith: `HD-${year}-` } },
        select: { code: true },
        orderBy: { code: 'desc' },
      });
      const sequence = latest ? Number(latest.code.slice(-6)) + 1 : 1;
      const code = `HD-${year}-${sequence.toString().padStart(6, '0')}`;

      const ticket = await transaction.ticket.create({
        data: {
          code,
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          creatorId,
          categoryId: dto.categoryId,
          history: {
            create: {
              action: 'CREATED',
              actorId: creatorId,
              newValue: { code, status: 'OPEN' },
            },
          },
        },
        select: ticketSelect,
      });
      const admins = await transaction.user.findMany({
        where: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true },
      });
      const notificationData = admins.map((admin) => ({
        type: NotificationType.TICKET_CREATED,
        title: `Ticket ${ticket.code} đã được tạo`,
        message: ticket.title,
        recipientId: admin.id,
        actorId: creatorId,
        ticketId: ticket.id,
      }));
      await this.notifications.createMany(transaction, notificationData);
      return {
        ticket,
        recipientIds: notificationData.map((item) => item.recipientId),
      };
    });
    this.notifications.notifyRecipients(committed.recipientIds);
    return committed.ticket;
  }

  async findAll(
    user: AuthenticatedUser,
    query: QueryTicketsDto,
  ): Promise<PaginatedResult<Ticket>> {
    const where = this.createVisibleWhere(user, query);
    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        select: ticketSelect,
        orderBy: { [query.sortBy]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getById(id: string, user: AuthenticatedUser): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, ...this.createRoleScope(user), deletedAt: null },
      select: ticketSelect,
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async update(
    id: string,
    user: AuthenticatedUser,
    dto: UpdateTicketDto,
  ): Promise<Ticket> {
    return this.prisma.$transaction(async (transaction) => {
      const ticket = await transaction.ticket.findFirst({
        where: { id, creatorId: user.id, deletedAt: null },
        select: {
          id: true,
          creatorId: true,
          assigneeId: true,
          categoryId: true,
          title: true,
          description: true,
          priority: true,
          status: true,
        },
      });
      if (!ticket) throw new NotFoundException('Ticket not found');
      if (ticket.status !== TicketStatus.OPEN) {
        throw new ConflictException('Only OPEN tickets can be updated');
      }
      if (dto.categoryId && dto.categoryId !== ticket.categoryId) {
        const category = await transaction.category.findFirst({
          where: { id: dto.categoryId, isActive: true },
          select: { id: true },
        });
        if (!category) throw new NotFoundException('Category not found');
      }

      const changes = this.getTicketChanges(ticket, dto);
      if (changes.length === 0) {
        return transaction.ticket.findUniqueOrThrow({
          where: { id },
          select: ticketSelect,
        });
      }

      return transaction.ticket.update({
        where: { id },
        data: {
          ...dto,
          history: {
            create: changes.map((change) => ({ ...change, actorId: user.id })),
          },
        },
        select: ticketSelect,
      });
    });
  }

  async remove(id: string, user: AuthenticatedUser): Promise<Ticket> {
    return this.prisma.$transaction(async (transaction) => {
      const ticket = await transaction.ticket.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, creatorId: true },
      });
      if (!ticket) throw new NotFoundException('Ticket not found');
      if (user.role !== UserRole.ADMIN && ticket.creatorId !== user.id) {
        throw new NotFoundException('Ticket not found');
      }
      if (user.role === UserRole.AGENT) {
        throw new ForbiddenException('Agents cannot delete tickets');
      }

      return transaction.ticket.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          history: {
            create: {
              action: 'DELETED',
              field: 'deletedAt',
              oldValue: Prisma.JsonNull,
              newValue: { deleted: true },
              actorId: user.id,
            },
          },
        },
        select: ticketSelect,
      });
    });
  }

  async assign(
    id: string,
    actorId: string,
    dto: AssignTicketDto,
  ): Promise<Ticket> {
    const committed = await this.prisma.$transaction(async (transaction) => {
      const [ticket, agent] = await Promise.all([
        transaction.ticket.findFirst({
          where: { id, deletedAt: null },
          select: {
            id: true,
            code: true,
            title: true,
            creatorId: true,
            status: true,
            assigneeId: true,
          },
        }),
        transaction.user.findFirst({
          where: {
            id: dto.agentId,
            role: UserRole.AGENT,
            status: UserStatus.ACTIVE,
            deletedAt: null,
          },
          select: { id: true },
        }),
      ]);
      if (!ticket) throw new NotFoundException('Ticket not found');
      if (!agent) throw new NotFoundException('Active agent not found');
      if (
        ticket.status === TicketStatus.CLOSED ||
        ticket.status === TicketStatus.CANCELLED
      ) {
        throw new ConflictException('Terminal tickets cannot be assigned');
      }
      if (ticket.assigneeId === agent.id) {
        throw new ConflictException('Ticket is already assigned to this agent');
      }

      const nextStatus =
        ticket.status === TicketStatus.OPEN
          ? TicketStatus.ASSIGNED
          : ticket.status;
      const history: Array<{
        action: string;
        field: string;
        oldValue: Prisma.InputJsonValue;
        newValue: Prisma.InputJsonValue;
        actorId: string;
      }> = [
        {
          action: 'ASSIGNED',
          field: 'assigneeId',
          oldValue: { agentId: ticket.assigneeId },
          newValue: { agentId: agent.id },
          actorId,
        },
      ];
      if (nextStatus !== ticket.status) {
        history.push({
          action: 'STATUS_UPDATED',
          field: 'status',
          oldValue: { status: ticket.status },
          newValue: { status: nextStatus },
          actorId,
        });
      }
      const updatedTicket = await transaction.ticket.update({
        where: { id },
        data: {
          assigneeId: agent.id,
          status: nextStatus,
          history: { create: history },
        },
        select: ticketSelect,
      });
      const notificationData = [ticket.creatorId, agent.id]
        .filter((recipientId) => recipientId !== actorId)
        .map((recipientId) => ({
          type: NotificationType.TICKET_ASSIGNED,
          title: `Ticket ${ticket.code} đã được phân công`,
          message: ticket.title,
          recipientId,
          actorId,
          ticketId: ticket.id,
        }));
      await this.notifications.createMany(transaction, notificationData);
      return {
        ticket: updatedTicket,
        recipientIds: notificationData.map((item) => item.recipientId),
      };
    });
    this.notifications.notifyRecipients(committed.recipientIds);
    return committed.ticket;
  }

  async take(id: string, user: AuthenticatedUser): Promise<Ticket> {
    const committed = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.ticket.updateMany({
        where: {
          id,
          deletedAt: null,
          status: TicketStatus.OPEN,
          assigneeId: null,
        },
        data: { assigneeId: user.id, status: TicketStatus.ASSIGNED },
      });
      if (updated.count !== 1) {
        const exists = await transaction.ticket.findFirst({
          where: { id, deletedAt: null },
          select: { id: true, code: true, title: true, creatorId: true },
        });
        if (!exists) throw new NotFoundException('Ticket not found');
        throw new ConflictException('Ticket is no longer available to take');
      }
      await transaction.ticketHistory.createMany({
        data: [
          {
            ticketId: id,
            actorId: user.id,
            action: 'ASSIGNED',
            field: 'assigneeId',
            oldValue: Prisma.JsonNull,
            newValue: { agentId: user.id },
          },
          {
            ticketId: id,
            actorId: user.id,
            action: 'STATUS_UPDATED',
            field: 'status',
            oldValue: { status: TicketStatus.OPEN },
            newValue: { status: TicketStatus.ASSIGNED },
          },
        ],
      });
      const ticket = await transaction.ticket.findUniqueOrThrow({
        where: { id },
        select: { code: true, title: true, creatorId: true },
      });
      const notificationData = [
        {
          type: NotificationType.TICKET_ASSIGNED,
          title: `Ticket ${ticket.code} đã được tiếp nhận`,
          message: ticket.title,
          recipientId: ticket.creatorId,
          actorId: user.id,
          ticketId: id,
        },
      ];
      await this.notifications.createMany(transaction, notificationData);
      const updatedTicket = await transaction.ticket.findUniqueOrThrow({
        where: { id },
        select: ticketSelect,
      });
      return {
        ticket: updatedTicket,
        recipientIds: notificationData.map((item) => item.recipientId),
      };
    });
    this.notifications.notifyRecipients(committed.recipientIds);
    return committed.ticket;
  }

  async updateStatus(
    id: string,
    user: AuthenticatedUser,
    dto: UpdateTicketStatusDto,
  ): Promise<Ticket> {
    const committed = await this.prisma.$transaction(async (transaction) => {
      const ticket = await transaction.ticket.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, creatorId: true, assigneeId: true, status: true },
      });
      if (!ticket) throw new NotFoundException('Ticket not found');
      this.assertTransitionAllowed(ticket, user, dto.status);

      const now = new Date();
      const updated = await transaction.ticket.updateMany({
        where: { id, status: ticket.status, deletedAt: null },
        data: {
          status: dto.status,
          resolvedAt: dto.status === TicketStatus.RESOLVED ? now : undefined,
          closedAt: dto.status === TicketStatus.CLOSED ? now : undefined,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'Ticket status changed; reload and try again',
        );
      }
      await transaction.ticketHistory.create({
        data: {
          ticketId: id,
          actorId: user.id,
          action: 'STATUS_UPDATED',
          field: 'status',
          oldValue: { status: ticket.status },
          newValue: { status: dto.status },
        },
      });
      const notificationData = [ticket.creatorId, ticket.assigneeId]
        .filter(
          (recipientId): recipientId is string =>
            Boolean(recipientId) && recipientId !== user.id,
        )
        .map((recipientId) => ({
          type: NotificationType.TICKET_STATUS_UPDATED,
          title: 'Trạng thái ticket đã thay đổi',
          message: `${ticket.status} → ${dto.status}`,
          recipientId,
          actorId: user.id,
          ticketId: id,
        }));
      await this.notifications.createMany(transaction, notificationData);
      const updatedTicket = await transaction.ticket.findUniqueOrThrow({
        where: { id },
        select: ticketSelect,
      });
      return {
        ticket: updatedTicket,
        recipientIds: notificationData.map((item) => item.recipientId),
      };
    });
    this.notifications.notifyRecipients(committed.recipientIds);
    return committed.ticket;
  }

  async getHistory(id: string, user: AuthenticatedUser) {
    await this.getById(id, user);
    return this.prisma.ticketHistory.findMany({
      where: { ticketId: id },
      select: historySelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  private assertTransitionAllowed(
    ticket: Pick<MutableTicket, 'creatorId' | 'assigneeId' | 'status'>,
    user: AuthenticatedUser,
    nextStatus: TicketStatus,
  ): void {
    const transition = `${ticket.status}:${nextStatus}`;
    const ownerTransitions = new Set([
      `${TicketStatus.OPEN}:${TicketStatus.CANCELLED}`,
      `${TicketStatus.RESOLVED}:${TicketStatus.CLOSED}`,
      `${TicketStatus.RESOLVED}:${TicketStatus.REOPENED}`,
    ]);
    const adminTransitions = new Set([
      `${TicketStatus.OPEN}:${TicketStatus.CANCELLED}`,
      `${TicketStatus.RESOLVED}:${TicketStatus.CLOSED}`,
    ]);
    const agentTransitions = new Set([
      `${TicketStatus.ASSIGNED}:${TicketStatus.IN_PROGRESS}`,
      `${TicketStatus.IN_PROGRESS}:${TicketStatus.WAITING_FOR_USER}`,
      `${TicketStatus.WAITING_FOR_USER}:${TicketStatus.IN_PROGRESS}`,
      `${TicketStatus.IN_PROGRESS}:${TicketStatus.RESOLVED}`,
      `${TicketStatus.REOPENED}:${TicketStatus.IN_PROGRESS}`,
    ]);

    const allowed =
      (user.role === UserRole.USER &&
        ticket.creatorId === user.id &&
        ownerTransitions.has(transition)) ||
      (user.role === UserRole.ADMIN && adminTransitions.has(transition)) ||
      (user.role === UserRole.AGENT &&
        ticket.assigneeId === user.id &&
        agentTransitions.has(transition));
    if (!allowed) {
      throw new ForbiddenException('Ticket status transition is not allowed');
    }
  }

  private getTicketChanges(ticket: MutableTicket, dto: UpdateTicketDto) {
    const fields = ['title', 'description', 'priority', 'categoryId'] as const;
    return fields.flatMap((field) => {
      const value = dto[field];
      if (value === undefined || value === ticket[field]) return [];
      return [
        {
          action: 'UPDATED',
          field,
          oldValue: { value: ticket[field] },
          newValue: { value },
        },
      ];
    });
  }

  private createVisibleWhere(
    user: AuthenticatedUser,
    query: QueryTicketsDto,
  ): Prisma.TicketWhereInput {
    const search = query.search?.trim();
    return {
      deletedAt: null,
      status: query.status,
      priority: query.priority,
      AND: [
        this.createRoleScope(user),
        ...(search
          ? [
              {
                OR: [
                  { code: { contains: search, mode: 'insensitive' } },
                  { title: { contains: search, mode: 'insensitive' } },
                ],
              } satisfies Prisma.TicketWhereInput,
            ]
          : []),
      ],
    };
  }

  private createRoleScope(user: AuthenticatedUser): Prisma.TicketWhereInput {
    if (user.role === UserRole.USER) {
      return { creatorId: user.id };
    }
    if (user.role === UserRole.AGENT) {
      return { OR: [{ assigneeId: null }, { assigneeId: user.id }] };
    }
    return {};
  }
}
