import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { AttachmentStorageService } from './attachment-storage.service';

@Module({
  controllers: [AttachmentsController],
  providers: [AttachmentsService, AttachmentStorageService, JwtAuthGuard],
})
export class AttachmentsModule {}
