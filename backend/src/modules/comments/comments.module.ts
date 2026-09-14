import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CommentsController],
  providers: [CommentsService, JwtAuthGuard],
})
export class CommentsModule {}
