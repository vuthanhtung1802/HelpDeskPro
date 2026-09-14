import 'reflect-metadata';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { NotificationType, TicketStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { commentSelect, CommentsService } from './comments.service';

const user: AuthenticatedUser = {
  id: '47d0329b-9a98-42fc-91bd-6c80bd004d26',
  email: 'user@example.com',
  fullName: 'Test User',
  role: UserRole.USER,
};

describe('CommentsService', () => {
  const ticketRepository = { findFirst: jest.fn() };
  const commentRepository = { findMany: jest.fn(), create: jest.fn() };
  const prisma = {
    ticket: ticketRepository,
    comment: commentRepository,
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const notifications = {
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    notifyRecipients: jest.fn(),
  } as unknown as NotificationsService;
  let service: CommentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(
      (operation: (client: PrismaService) => unknown) => operation(prisma),
    );
    service = new CommentsService(prisma, notifications);
  });

  it('hides internal notes from the ticket owner', async () => {
    ticketRepository.findFirst.mockResolvedValue({ id: 'ticket-id' });
    commentRepository.findMany.mockResolvedValue([]);

    await service.findAll('ticket-id', user);

    expect(commentRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ticketId: 'ticket-id', isInternal: false },
      }),
    );
  });

  it('allows the assigned agent to add a public comment', async () => {
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      code: 'HD-2026-000001',
      creatorId: user.id,
      assigneeId: agent.id,
      status: TicketStatus.IN_PROGRESS,
    });
    commentRepository.create.mockResolvedValue({ id: 'comment-id' });

    await service.create('ticket-id', agent, { content: 'Working on it' });

    expect(commentRepository.create).toHaveBeenCalledWith({
      data: {
        ticketId: 'ticket-id',
        authorId: agent.id,
        content: 'Working on it',
        isInternal: false,
      },
      select: commentSelect,
    });
    expect(notifications.createMany).toHaveBeenCalledWith(prisma, [
      {
        type: NotificationType.COMMENT_CREATED,
        title: 'Có phản hồi mới trong HD-2026-000001',
        message: 'Working on it',
        recipientId: user.id,
        actorId: agent.id,
        ticketId: 'ticket-id',
      },
    ]);
    expect(notifications.notifyRecipients).toHaveBeenCalledWith([user.id]);
  });

  it('does not publish when storing the notification fails', async () => {
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      code: 'HD-2026-000001',
      creatorId: user.id,
      assigneeId: agent.id,
      status: TicketStatus.IN_PROGRESS,
    });
    commentRepository.create.mockResolvedValue({ id: 'comment-id' });
    (notifications.createMany as jest.Mock).mockRejectedValueOnce(
      new Error('Database write failed'),
    );

    await expect(
      service.create('ticket-id', agent, { content: 'Working on it' }),
    ).rejects.toThrow('Database write failed');

    expect(notifications.notifyRecipients).not.toHaveBeenCalled();
  });

  it('rejects a comment from an unassigned agent', async () => {
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      creatorId: user.id,
      assigneeId: null,
      status: TicketStatus.OPEN,
    });

    await expect(
      service.create('ticket-id', agent, { content: 'Unauthorized comment' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(commentRepository.create).not.toHaveBeenCalled();
  });

  it('rejects new comments on a closed ticket', async () => {
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      creatorId: user.id,
      assigneeId: null,
      status: TicketStatus.CLOSED,
    });

    await expect(
      service.create('ticket-id', user, { content: 'Too late' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
