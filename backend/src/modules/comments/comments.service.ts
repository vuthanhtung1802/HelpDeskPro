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
} from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';

export const commentSelect = {
  id: true,
  content: true,
  isInternal: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      role: true,
    },
  },
} satisfies Prisma.CommentSelect;

type Comment = Prisma.CommentGetPayload<{ select: typeof commentSelect }>;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(ticketId: string, user: AuthenticatedUser): Promise<Comment[]> {
    await this.assertCanView(ticketId, user);
    return this.prisma.comment.findMany({
      where: {
        ticketId,
        ...(user.role === UserRole.USER ? { isInternal: false } : {}),
      },
      select: commentSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    ticketId: string,
    user: AuthenticatedUser,
    dto: CreateCommentDto,
    isInternal = false,
  ): Promise<Comment> {
    const committed = await this.prisma.$transaction(async (transaction) => {
      const ticket = await transaction.ticket.findFirst({
        where: { id: ticketId, deletedAt: null },
        select: {
          id: true,
          code: true,
          creatorId: true,
          assigneeId: true,
          status: true,
        },
      });
      if (!ticket) throw new NotFoundException('Ticket not found');
      if (
        ticket.status === TicketStatus.CLOSED ||
        ticket.status === TicketStatus.CANCELLED
      ) {
        throw new ConflictException('Terminal tickets cannot receive comments');
      }

      const canComment = isInternal
        ? user.role === UserRole.ADMIN ||
          (user.role === UserRole.AGENT && ticket.assigneeId === user.id)
        : (user.role === UserRole.USER && ticket.creatorId === user.id) ||
          (user.role === UserRole.AGENT && ticket.assigneeId === user.id);
      if (!canComment) {
        throw new ForbiddenException('You cannot comment on this ticket');
      }

      const comment = await transaction.comment.create({
        data: {
          ticketId,
          authorId: user.id,
          content: dto.content,
          isInternal,
        },
        select: commentSelect,
      });
      const recipientId = isInternal
        ? user.role === UserRole.ADMIN
          ? ticket.assigneeId
          : null
        : user.role === UserRole.USER
          ? ticket.assigneeId
          : ticket.creatorId;
      const notificationData =
        recipientId && recipientId !== user.id
          ? [
              {
                type: NotificationType.COMMENT_CREATED,
                title: `Có phản hồi mới trong ${ticket.code}`,
                message: dto.content.slice(0, 200),
                recipientId,
                actorId: user.id,
                ticketId,
              },
            ]
          : [];
      await this.notifications.createMany(transaction, notificationData);
      return {
        comment,
        recipientIds: notificationData.map((item) => item.recipientId),
      };
    });
    this.notifications.notifyRecipients(committed.recipientIds);
    return committed.comment;
  }

  private async assertCanView(
    ticketId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const roleScope: Prisma.TicketWhereInput =
      user.role === UserRole.USER
        ? { creatorId: user.id }
        : user.role === UserRole.AGENT
          ? { OR: [{ assigneeId: null }, { assigneeId: user.id }] }
          : {};
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, deletedAt: null, ...roleScope },
      select: { id: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
  }
}
