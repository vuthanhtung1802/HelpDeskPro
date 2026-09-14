import 'reflect-metadata';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const ticketRepository = { count: jest.fn() };
  const prisma = {
    ticket: ticketRepository,
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(
      (operations: Array<Promise<number>>) => Promise.all(operations),
    );
    ticketRepository.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    service = new DashboardService(prisma);
  });

  it('returns ticket totals scoped to the current customer', async () => {
    await expect(service.getUserStats('user-id')).resolves.toEqual({
      totalTickets: 12,
      activeTickets: 7,
      resolvedTickets: 4,
      overdueTickets: 2,
    });
    expect(ticketRepository.count).toHaveBeenNthCalledWith(1, {
      where: { deletedAt: null, creatorId: 'user-id' },
    });
    expect(ticketRepository.count).toHaveBeenNthCalledWith(2, {
      where: {
        deletedAt: null,
        creatorId: 'user-id',
        status: {
          in: [
            TicketStatus.OPEN,
            TicketStatus.ASSIGNED,
            TicketStatus.IN_PROGRESS,
            TicketStatus.WAITING_FOR_USER,
            TicketStatus.REOPENED,
          ],
        },
      },
    });
  });

  it('scopes agent totals to assigned tickets', async () => {
    await service.getAgentStats('agent-id');

    expect(ticketRepository.count).toHaveBeenNthCalledWith(1, {
      where: { deletedAt: null, assigneeId: 'agent-id' },
    });
  });

  it('uses all non-deleted tickets for admin totals', async () => {
    await service.getAdminStats();

    expect(ticketRepository.count).toHaveBeenNthCalledWith(1, {
      where: { deletedAt: null },
    });
  });
});
