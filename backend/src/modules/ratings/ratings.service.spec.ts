import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  const ticketRepository = { findFirst: jest.fn() };
  const ratingRepository = { create: jest.fn() };
  const prisma = {
    ticket: ticketRepository,
    rating: ratingRepository,
  } as unknown as PrismaService;
  let service: RatingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RatingsService(prisma);
  });

  it('creates one rating for the assigned agent on a closed owned ticket', async () => {
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      status: TicketStatus.CLOSED,
      assigneeId: 'agent-id',
      rating: null,
    });
    ratingRepository.create.mockResolvedValue({
      id: 'rating-id',
      score: 5,
      comment: 'Helpful',
    });

    await expect(
      service.create('ticket-id', 'user-id', { score: 5, comment: 'Helpful' }),
    ).resolves.toEqual({ id: 'rating-id', score: 5, comment: 'Helpful' });
    expect(ratingRepository.create).toHaveBeenCalledTimes(1);
  });

  it('does not reveal a ticket owned by another customer', async () => {
    ticketRepository.findFirst.mockResolvedValue(null);

    await expect(
      service.create('ticket-id', 'user-id', { score: 4 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a rating before the ticket is closed', async () => {
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      status: TicketStatus.RESOLVED,
      assigneeId: 'agent-id',
      rating: null,
    });

    await expect(
      service.create('ticket-id', 'user-id', { score: 4 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a second rating on the same ticket', async () => {
    ticketRepository.findFirst.mockResolvedValue({
      id: 'ticket-id',
      status: TicketStatus.CLOSED,
      assigneeId: 'agent-id',
      rating: { id: 'existing-rating' },
    });

    await expect(
      service.create('ticket-id', 'user-id', { score: 3 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(ratingRepository.create).not.toHaveBeenCalled();
  });
});
