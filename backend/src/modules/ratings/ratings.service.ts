import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

export const ratingSelect = {
  id: true,
  score: true,
  comment: true,
  createdAt: true,
  agent: { select: { id: true, fullName: true } },
} satisfies Prisma.RatingSelect;

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ticketId: string, creatorId: string, dto: CreateRatingDto) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, creatorId, deletedAt: null },
      select: {
        id: true,
        status: true,
        assigneeId: true,
        rating: { select: { id: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== TicketStatus.CLOSED) {
      throw new ConflictException('Only CLOSED tickets can be rated');
    }
    if (!ticket.assigneeId) {
      throw new ConflictException('A ticket without an agent cannot be rated');
    }
    if (ticket.rating) {
      throw new ConflictException('Ticket has already been rated');
    }

    try {
      return await this.prisma.rating.create({
        data: {
          ticketId,
          creatorId,
          agentId: ticket.assigneeId,
          score: dto.score,
          comment: dto.comment || null,
        },
        select: ratingSelect,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ticket has already been rated');
      }
      throw error;
    }
  }
}
