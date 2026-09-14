import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';
import { UsersService } from '../users/users.service';

const userRoom = (userId: string) => `user:${userId}`;

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    const token: unknown = client.handshake.auth.token;
    if (typeof token !== 'string') {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        AccessTokenPayload & { exp?: number }
      >(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.tokenType !== 'access') throw new Error('Invalid token type');
      const user = await this.usersService.findActiveById(payload.sub);
      if (!user) throw new Error('Inactive account');
      await client.join(userRoom(user.id));
      if (payload.exp) {
        const expiresIn = Math.max(payload.exp * 1000 - Date.now(), 0);
        const expirationTimer = setTimeout(
          () => client.disconnect(true),
          expiresIn,
        );
        client.once('disconnect', () => clearTimeout(expirationTimer));
      }
    } catch {
      client.disconnect();
    }
  }

  notifyRecipients(recipientIds: string[]): void {
    for (const recipientId of new Set(recipientIds)) {
      this.server.to(userRoom(recipientId)).emit('notifications:changed');
    }
  }
}
