import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { attachmentUploadOptions } from './attachment-upload.config';
import { AttachmentsService } from './attachments.service';

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get('tickets/:ticketId/attachments')
  @ApiOperation({ summary: 'List attachments visible on a ticket' })
  findAll(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attachmentsService.findAll(ticketId, user);
  }

  @Post('tickets/:ticketId/attachments')
  @UseInterceptors(FileInterceptor('file', attachmentUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload one attachment to a ticket' })
  async create(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.attachmentsService.create(ticketId, user, file);
  }

  @Get('attachments/:id/download')
  @ApiOperation({
    summary: 'Download an attachment visible to the current user',
  })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ): Promise<void> {
    const attachment = await this.attachmentsService.getDownload(id, user);
    response.type(attachment.mimeType);
    response.attachment(attachment.originalName);
    response.send(attachment.content);
  }

  @Delete('attachments/:id')
  @ApiOperation({
    summary: 'Delete an owned attachment or any attachment as admin',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attachmentsService.remove(id, user);
  }
}
