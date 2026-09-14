import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  environment: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  frontendUrl: process.env.FRONTEND_URL,
}));
