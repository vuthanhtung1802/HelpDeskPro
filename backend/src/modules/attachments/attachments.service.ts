import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AttachmentStorageService } from './attachment-storage.service';

const attachmentSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  size: true,
  url: true,
  createdAt: true,
  uploader: { select: { id: true, fullName: true } },
} satisfies Prisma.AttachmentSelect;

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: AttachmentStorageService,
  ) {}

  async findAll(ticketId: string, user: AuthenticatedUser) {
    await this.assertCanViewTicket(ticketId, user);
    return this.prisma.attachment.findMany({
      where: { ticketId },
      select: attachmentSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    ticketId: string,
    user: AuthenticatedUser,
    file: Express.Multer.File,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, deletedAt: null },
      select: { id: true, creatorId: true, assigneeId: true, status: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (
      ticket.status === TicketStatus.CLOSED ||
      ticket.status === TicketStatus.CANCELLED
    ) {
      throw new ConflictException(
        'Terminal tickets cannot receive attachments',
      );
    }
    const allowed =
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.USER && ticket.creatorId === user.id) ||
      (user.role === UserRole.AGENT && ticket.assigneeId === user.id);
    if (!allowed) throw new ForbiddenException('You cannot attach files here');

    const attachmentId = randomUUID();
    const stored = await this.storage.store(file);
    try {
      return await this.prisma.attachment.create({
        data: {
          id: attachmentId,
          originalName: file.originalname,
          fileName: stored.key,
          mimeType: file.mimetype,
          size: file.size,
          url: `/api/v1/attachments/${attachmentId}/download`,
          ticketId,
          uploaderId: user.id,
        },
        select: attachmentSelect,
      });
    } catch (error: unknown) {
      await this.storage.remove(stored.key).catch(() => undefined);
      throw error;
    }
  }

  async getDownload(id: string, user: AuthenticatedUser) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id },
      select: {
        id: true,
        originalName: true,
        fileName: true,
        mimeType: true,
        ticket: {
          select: { creatorId: true, assigneeId: true, deletedAt: true },
        },
      },
    });
    if (!attachment || !this.canViewTicket(attachment.ticket, user)) {
      throw new NotFoundException('Attachment not found');
    }
    return {
      ...attachment,
      content: await this.storage.read(attachment.fileName),
    };
  }

  async remove(id: string, user: AuthenticatedUser) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id },
      select: { id: true, fileName: true, uploaderId: true },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (user.role !== UserRole.ADMIN && attachment.uploaderId !== user.id) {
      throw new NotFoundException('Attachment not found');
    }
    await this.prisma.attachment.delete({ where: { id } });
    await this.storage.remove(attachment.fileName).catch(() => undefined);
    return { id };
  }

  private async assertCanViewTicket(
    ticketId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, deletedAt: null },
      select: { creatorId: true, assigneeId: true, deletedAt: true },
    });
    if (!ticket || !this.canViewTicket(ticket, user)) {
      throw new NotFoundException('Ticket not found');
    }
  }

  private canViewTicket(
    ticket: {
      creatorId: string;
      assigneeId: string | null;
      deletedAt: Date | null;
    },
    user: AuthenticatedUser,
  ): boolean {
    if (ticket.deletedAt) return false;
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.USER) return ticket.creatorId === user.id;
    return ticket.assigneeId === null || ticket.assigneeId === user.id;
  }
}
