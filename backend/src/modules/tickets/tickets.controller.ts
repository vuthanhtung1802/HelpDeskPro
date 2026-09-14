import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Create a support ticket' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tickets visible to the current user' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTicketsDto,
  ) {
    return this.ticketsService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a visible ticket by ID' })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.getById(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Update an OPEN ticket owned by the current user' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-delete an owned ticket or any ticket as admin',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.remove(id, user);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign or reassign a ticket to an agent' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignTicketDto,
  ) {
    return this.ticketsService.assign(id, user.id, dto);
  }

  @Patch(':id/take')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Take an unassigned OPEN ticket' })
  take(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.take(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Apply an allowed ticket status transition' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateStatus(id, user, dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get ticket change history' })
  getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.getHistory(id, user);
  }
}
