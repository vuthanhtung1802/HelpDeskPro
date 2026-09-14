import 'reflect-metadata';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketPriority, TicketStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { Ticket, TicketsService } from './tickets.service';

const user: AuthenticatedUser = {
  id: '47d0329b-9a98-42fc-91bd-6c80bd004d26',
  email: 'user@example.com',
  fullName: 'Test User',
  role: UserRole.USER,
};

const ticket: Ticket = {
  id: '53e71443-f6a8-4696-bbc6-904535079025',
  code: 'HD-2026-000001',
  title: 'Cannot log in',
  description: 'The login page reports an unexpected error.',
  priority: TicketPriority.HIGH,
  status: TicketStatus.OPEN,
  resolvedAt: null,
  closedAt: null,
  dueAt: null,
  createdAt: new Date('2026-09-03T00:00:00.000Z'),
  updatedAt: new Date('2026-09-03T00:00:00.000Z'),
  creator: {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: null,
  },
  assignee: null,
  category: {
    id: '96bc46cd-8d50-4dcb-85d8-b5a27472730b',
    name: 'Account',
    slug: 'account',
  },
  rating: null,
};

describe('TicketsService', () => {
  const ticketRepository = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  const ticketHistoryRepository = {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
  };
  const prisma = {
    ticket: ticketRepository,
    ticketHistory: ticketHistoryRepository,
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const notifications = {
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    notifyRecipients: jest.fn(),
  } as unknown as NotificationsService;

  let service: TicketsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TicketsService(prisma, notifications);
    (prisma.$transaction as jest.Mock).mockImplementation(
      (
        operation:
          ((client: PrismaService) => unknown) | Array<Promise<unknown>>,
      ) =>
        typeof operation === 'function'
          ? operation(prisma)
          : Promise.all(operation),
    );
  });

  it('limits a USER list to tickets they created', async () => {
    let receivedArgs: Prisma.TicketFindManyArgs | undefined;
    ticketRepository.findMany.mockImplementation(
      (args: Prisma.TicketFindManyArgs) => {
        receivedArgs = args;
        return Promise.resolve([ticket]);
      },
    );
    ticketRepository.count.mockResolvedValue(1);
    (prisma.$transaction as jest.Mock).mockImplementation(
      (operations: Array<Promise<unknown>>) => Promise.all(operations),
    );

    const query = Object.assign(new QueryTicketsDto(), { search: 'login' });
    const result = await service.findAll(user, query);

    expect(result.data).toEqual([ticket]);
    expect(receivedArgs?.where).toMatchObject({ deletedAt: null });
    expect((receivedArgs?.where?.AND as Prisma.TicketWhereInput[])[0]).toEqual({
      creatorId: user.id,
    });
  });

  it('lets an AGENT see only unassigned or personally assigned tickets', async () => {
    let receivedArgs: Prisma.TicketFindManyArgs | undefined;
    ticketRepository.findMany.mockImplementation(
      (args: Prisma.TicketFindManyArgs) => {
        receivedArgs = args;
        return Promise.resolve([]);
      },
    );
    ticketRepository.count.mockResolvedValue(0);
    (prisma.$transaction as jest.Mock).mockImplementation(
      (operations: Array<Promise<unknown>>) => Promise.all(operations),
    );
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };

    await service.findAll(agent, new QueryTicketsDto());

    expect(receivedArgs?.where).toMatchObject({
      AND: [{ OR: [{ assigneeId: null }, { assigneeId: agent.id }] }],
    });
  });

  it('does not reveal a ticket outside the current user scope', async () => {
    ticketRepository.findFirst.mockResolvedValue(null);

    await expect(service.getById(ticket.id, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(ticketRepository.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ticket.id, creatorId: user.id, deletedAt: null },
      }),
    );
  });

  it('allows the assigned AGENT to move ASSIGNED to IN_PROGRESS', async () => {
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };
    ticketRepository.findFirst.mockResolvedValue({
      id: ticket.id,
      creatorId: user.id,
      assigneeId: agent.id,
      status: TicketStatus.ASSIGNED,
    });
    ticketRepository.updateMany.mockResolvedValue({ count: 1 });
    ticketHistoryRepository.create.mockResolvedValue({});
    ticketRepository.findUniqueOrThrow.mockResolvedValue({
      ...ticket,
      status: TicketStatus.IN_PROGRESS,
    });

    const result = await service.updateStatus(ticket.id, agent, {
      status: TicketStatus.IN_PROGRESS,
    });

    expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    expect(ticketRepository.updateMany).toHaveBeenCalledWith({
      where: {
        id: ticket.id,
        status: TicketStatus.ASSIGNED,
        deletedAt: null,
      },
      data: {
        status: TicketStatus.IN_PROGRESS,
        resolvedAt: undefined,
        closedAt: undefined,
      },
    });
    expect(ticketHistoryRepository.create).toHaveBeenCalledWith({
      data: {
        ticketId: ticket.id,
        actorId: agent.id,
        action: 'STATUS_UPDATED',
        field: 'status',
        oldValue: { status: TicketStatus.ASSIGNED },
        newValue: { status: TicketStatus.IN_PROGRESS },
      },
    });
  });

  it('rejects a status transition that is outside the business matrix', async () => {
    ticketRepository.findFirst.mockResolvedValue({
      id: ticket.id,
      creatorId: user.id,
      assigneeId: null,
      status: TicketStatus.OPEN,
    });

    await expect(
      service.updateStatus(ticket.id, user, {
        status: TicketStatus.CLOSED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(ticketRepository.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an AGENT who attempts to update another agent ticket', async () => {
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };
    ticketRepository.findFirst.mockResolvedValue({
      id: ticket.id,
      creatorId: user.id,
      assigneeId: 'other-agent-id',
      status: TicketStatus.ASSIGNED,
    });

    await expect(
      service.updateStatus(ticket.id, agent, {
        status: TicketStatus.IN_PROGRESS,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('atomically takes an available ticket and records both changes', async () => {
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };
    ticketRepository.updateMany.mockResolvedValue({ count: 1 });
    ticketHistoryRepository.createMany.mockResolvedValue({ count: 2 });
    ticketRepository.findUniqueOrThrow.mockResolvedValue({
      ...ticket,
      status: TicketStatus.ASSIGNED,
      assignee: {
        id: agent.id,
        fullName: agent.fullName,
        email: agent.email,
        avatarUrl: null,
      },
    });

    await service.take(ticket.id, agent);

    expect(ticketRepository.updateMany).toHaveBeenCalledWith({
      where: {
        id: ticket.id,
        deletedAt: null,
        status: TicketStatus.OPEN,
        assigneeId: null,
      },
      data: { assigneeId: agent.id, status: TicketStatus.ASSIGNED },
    });
    expect(ticketHistoryRepository.createMany).toHaveBeenCalledWith({
      data: [
        {
          ticketId: ticket.id,
          actorId: agent.id,
          action: 'ASSIGNED',
          field: 'assigneeId',
          oldValue: Prisma.JsonNull,
          newValue: { agentId: agent.id },
        },
        {
          ticketId: ticket.id,
          actorId: agent.id,
          action: 'STATUS_UPDATED',
          field: 'status',
          oldValue: { status: TicketStatus.OPEN },
          newValue: { status: TicketStatus.ASSIGNED },
        },
      ],
    });
  });

  it('rejects taking a ticket after another agent won the race', async () => {
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };
    ticketRepository.updateMany.mockResolvedValue({ count: 0 });
    ticketRepository.findFirst.mockResolvedValue({ id: ticket.id });

    await expect(service.take(ticket.id, agent)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(ticketHistoryRepository.createMany).not.toHaveBeenCalled();
  });
});
