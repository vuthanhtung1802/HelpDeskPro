import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';

@Module({
  controllers: [AiChatController],
  providers: [AiChatService, JwtAuthGuard, RolesGuard],
})
export class AiChatModule {}
