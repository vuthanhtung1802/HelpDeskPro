import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const createContext = (role?: UserRole): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('allows endpoints without role metadata', () => {
    jest.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);

    expect(new RolesGuard(reflector).canActivate(createContext())).toBe(true);
  });

  it('allows users with a required role', () => {
    jest.mocked(reflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);

    expect(
      new RolesGuard(reflector).canActivate(createContext(UserRole.ADMIN)),
    ).toBe(true);
  });

  it('rejects users without a required role', () => {
    jest.mocked(reflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);

    expect(
      new RolesGuard(reflector).canActivate(createContext(UserRole.USER)),
    ).toBe(false);
  });
});
