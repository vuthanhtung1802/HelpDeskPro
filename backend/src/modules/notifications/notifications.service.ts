import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  actorId?: string;
  ticketId?: string;
}

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  isRead: true,
  createdAt: true,
  ticket: { select: { id: true, code: true, title: true } },
  actor: { select: { id: true, fullName: true } },
} satisfies Prisma.NotificationSelect;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  findAll(recipientId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId },
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markAsRead(id: string, recipientId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id, recipientId },
      data: { isRead: true },
    });
    if (updated.count === 0) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.findUniqueOrThrow({
      where: { id },
      select: notificationSelect,
    });
  }

  async markAllAsRead(recipientId: string): Promise<{ count: number }> {
    return this.prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });
  }

  async createMany(
    transaction: Prisma.TransactionClient,
    notifications: NotificationInput[],
  ): Promise<{ count: number }> {
    if (notifications.length === 0) return { count: 0 };
    const result = await transaction.notification.createMany({
      data: notifications,
    });
    return result;
  }

  notifyRecipients(recipientIds: string[]): void {
    this.gateway.notifyRecipients(recipientIds);
  }
}
