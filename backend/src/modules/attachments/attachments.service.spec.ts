import 'reflect-metadata';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AttachmentsService } from './attachments.service';
import { AttachmentStorageService } from './attachment-storage.service';

const user: AuthenticatedUser = {
  id: 'user-id',
  email: 'user@example.com',
  fullName: 'Test User',
  role: UserRole.USER,
};

const file = {
  originalname: 'evidence.pdf',
  filename: 'generated.pdf',
  mimetype: 'application/pdf',
  size: 2048,
  buffer: Buffer.from('file content'),
} as Express.Multer.File;

describe('AttachmentsService', () => {
  const ticketRepository = { findFirst: jest.fn() };
  const attachmentRepository = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };
  const prisma = {
    ticket: ticketRepository,
    attachment: attachmentRepository,
  } as unknown as PrismaService;
  const storage = {
    store: jest.fn().mockResolvedValue({
      key: 'generated.pdf',
    }),
    read: jest.fn(),
    remove: jest.fn().mockResolvedValue(undefined),
  } as unknown as AttachmentStorageService;
  let service: AttachmentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttachmentsService(prisma, storage);
  });

  it('allows the ticket owner to attach a file', async () => {
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      creatorId: user.id,
      assigneeId: null,
      status: TicketStatus.OPEN,
    });
    attachmentRepository.create.mockResolvedValue({ id: 'attachment-id' });

    await expect(service.create('ticket-id', user, file)).resolves.toEqual({
      id: 'attachment-id',
    });
    expect(attachmentRepository.create).toHaveBeenCalledTimes(1);
    expect(storage.store).toHaveBeenCalledWith(file);
  });

  it('rejects uploads from an unassigned agent', async () => {
    const agent = { ...user, id: 'agent-id', role: UserRole.AGENT };
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      creatorId: user.id,
      assigneeId: null,
      status: TicketStatus.OPEN,
    });

    await expect(
      service.create('ticket-id', agent, file),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects uploads on a terminal ticket', async () => {
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      creatorId: user.id,
      assigneeId: null,
      status: TicketStatus.CANCELLED,
    });

    await expect(
      service.create('ticket-id', user, file),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not reveal or delete another user attachment', async () => {
    attachmentRepository.findFirst.mockResolvedValue({
      id: 'attachment-id',
      fileName: file.filename,
      uploaderId: 'another-user',
    });

    await expect(service.remove('attachment-id', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(attachmentRepository.delete).not.toHaveBeenCalled();
  });
});
