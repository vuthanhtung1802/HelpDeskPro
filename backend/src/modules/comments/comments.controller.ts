import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('comments')
  @ApiOperation({ summary: 'List comments visible to the current user' })
  findAll(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentsService.findAll(ticketId, user);
  }

  @Post('comments')
  @ApiOperation({ summary: 'Add a public ticket comment' })
  create(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(ticketId, user, dto);
  }

  @Post('internal-notes')
  @ApiOperation({
    summary: 'Add an internal note as the assigned agent or admin',
  })
  createInternalNote(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(ticketId, user, dto, true);
  }
}
