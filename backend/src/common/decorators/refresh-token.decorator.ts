import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { REFRESH_TOKEN_COOKIE } from '../constants/auth.constants';

interface RequestWithCookies extends Request {
  cookies: Record<string, unknown>;
}

export const RefreshToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const token = request.cookies[REFRESH_TOKEN_COOKIE];

    return typeof token === 'string' ? token : undefined;
  },
);
