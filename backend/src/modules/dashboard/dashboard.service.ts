import { Injectable } from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface DashboardStats {
  totalTickets: number;
  activeTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
}

const activeStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.ASSIGNED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_USER,
  TicketStatus.REOPENED,
];

const resolvedStatuses: TicketStatus[] = [
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  getAdminStats(): Promise<DashboardStats> {
    return this.getStats({});
  }

  getAgentStats(agentId: string): Promise<DashboardStats> {
    return this.getStats({ assigneeId: agentId });
  }

  getUserStats(userId: string): Promise<DashboardStats> {
    return this.getStats({ creatorId: userId });
  }

  private async getStats(
    scope: Prisma.TicketWhereInput,
  ): Promise<DashboardStats> {
    const baseWhere: Prisma.TicketWhereInput = { deletedAt: null, ...scope };
    const [totalTickets, activeTickets, resolvedTickets, overdueTickets] =
      await this.prisma.$transaction([
        this.prisma.ticket.count({ where: baseWhere }),
        this.prisma.ticket.count({
          where: { ...baseWhere, status: { in: activeStatuses } },
        }),
        this.prisma.ticket.count({
          where: { ...baseWhere, status: { in: resolvedStatuses } },
        }),
        this.prisma.ticket.count({
          where: {
            ...baseWhere,
            dueAt: { lt: new Date() },
            status: { in: activeStatuses },
          },
        }),
      ]);

    return { totalTickets, activeTickets, resolvedTickets, overdueTickets };
  }
}
