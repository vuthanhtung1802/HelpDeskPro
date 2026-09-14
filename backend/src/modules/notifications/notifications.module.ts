import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, JwtAuthGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
