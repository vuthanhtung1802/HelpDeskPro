import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  const notificationRepository = {
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
    createMany: jest.fn(),
  };
  const prisma = {
    notification: notificationRepository,
  } as unknown as PrismaService;
  let service: NotificationsService;
  const gateway = {
    notifyRecipients: jest.fn(),
  } as unknown as NotificationsGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(prisma, gateway);
  });

  it('lists only notifications owned by the current user', async () => {
    notificationRepository.findMany.mockResolvedValue([]);

    await service.findAll('recipient-id');

    expect(notificationRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientId: 'recipient-id' } }),
    );
  });

  it('does not reveal or update another user notification', async () => {
    notificationRepository.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.markAsRead('notification-id', 'recipient-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(notificationRepository.updateMany).toHaveBeenCalledWith({
      where: { id: 'notification-id', recipientId: 'recipient-id' },
      data: { isRead: true },
    });
  });

  it('marks only the current user unread notifications as read', async () => {
    notificationRepository.updateMany.mockResolvedValue({ count: 3 });

    await expect(service.markAllAsRead('recipient-id')).resolves.toEqual({
      count: 3,
    });
    expect(notificationRepository.updateMany).toHaveBeenCalledWith({
      where: { recipientId: 'recipient-id', isRead: false },
      data: { isRead: true },
    });
  });

  it('stores notifications without publishing before the transaction commits', async () => {
    notificationRepository.createMany.mockResolvedValue({ count: 2 });
    const notifications = [
      {
        type: 'TICKET_CREATED' as const,
        title: 'New ticket',
        message: 'Ticket details',
        recipientId: 'admin-1',
      },
      {
        type: 'TICKET_CREATED' as const,
        title: 'New ticket',
        message: 'Ticket details',
        recipientId: 'admin-2',
      },
    ];

    await service.createMany(prisma, notifications);

    expect(gateway.notifyRecipients).not.toHaveBeenCalled();
  });

  it('publishes a committed notification change to its recipients', () => {
    service.notifyRecipients(['admin-1', 'admin-2']);

    expect(gateway.notifyRecipients).toHaveBeenCalledWith([
      'admin-1',
      'admin-2',
    ]);
  });
});
