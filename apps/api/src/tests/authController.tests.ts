import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError, fail, ok } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type { Context } from 'koa';

import { build__AuthController } from '../controllers/authController.js';
import type { AuthService } from '../services/authService.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
} satisfies Logger;

const createCtx = (body: Record<string, unknown>): Context => {
  return {
    request: { body },
    status: 0,
    body: undefined,
    ip: '127.0.0.1',
    app: { env: 'test' },
    state: {},
  } as unknown as Context;
};

describe('build__AuthController', () => {
  let authService: jest.Mocked<Pick<AuthService, 'forgotPassword' | 'resetPassword'>>;
  let authController: ReturnType<typeof build__AuthController>;

  beforeEach(() => {
    authService = {
      forgotPassword: jest.fn<AuthService['forgotPassword']>(),
      resetPassword: jest.fn<AuthService['resetPassword']>(),
    };
    authController = build__AuthController({
      authService: authService as unknown as AuthService,
      logger,
    });
  });

  describe('forgotPassword', () => {
    describe('When email is missing', () => {
      it('should return 200 with a generic message without calling the service', async () => {
        const ctx = createCtx({});

        await authController.forgotPassword(ctx);

        expect(authService.forgotPassword).not.toHaveBeenCalled();
        expect(ctx.status).toBe(200);
        expect(ctx.body).toEqual({
          message: "If an account exists for that email, we've sent a reset code.",
        });
      });
    });

    describe('When email is provided', () => {
      it('should return 200 with a generic message after requesting a reset', async () => {
        authService.forgotPassword.mockResolvedValue(ok(undefined));
        const ctx = createCtx({ email: 'user@example.test' });

        await authController.forgotPassword(ctx);

        expect(authService.forgotPassword).toHaveBeenCalledWith('user@example.test');
        expect(ctx.status).toBe(200);
        expect(ctx.body).toEqual({
          message: "If an account exists for that email, we've sent a reset code.",
        });
      });
    });
  });

  describe('resetPassword', () => {
    describe('When required fields are missing', () => {
      it('should return 400', async () => {
        const ctx = createCtx({ email: 'user@example.test', password: 'newPassword9' });

        await authController.resetPassword(ctx);

        expect(authService.resetPassword).not.toHaveBeenCalled();
        expect(ctx.status).toBe(400);
        expect(ctx.body).toEqual({ error: 'Email, password, and code are required' });
      });
    });

    describe('When the password is too short', () => {
      it('should return 400', async () => {
        const ctx = createCtx({
          email: 'user@example.test',
          password: 'short',
          code: '123456',
        });

        await authController.resetPassword(ctx);

        expect(authService.resetPassword).not.toHaveBeenCalled();
        expect(ctx.status).toBe(400);
        expect(ctx.body).toEqual({ error: 'Password must be at least 8 characters long' });
      });
    });

    describe('When the reset code is invalid', () => {
      it('should return 400 with the contract error display message', async () => {
        authService.resetPassword.mockResolvedValue(fail(ContractError.InvalidPasswordResetCode));
        const ctx = createCtx({
          email: 'user@example.test',
          password: 'newPassword9',
          code: '000000',
        });

        await authController.resetPassword(ctx);

        expect(authService.resetPassword).toHaveBeenCalledWith(
          'user@example.test',
          'newPassword9',
          '000000',
        );
        expect(ctx.status).toBe(400);
        expect(ctx.body).toEqual({ error: ContractError.InvalidPasswordResetCode.display });
      });
    });

    describe('When there are too many attempts', () => {
      it('should return 429', async () => {
        authService.resetPassword.mockResolvedValue(fail(ContractError.TooManyAttempts));
        const ctx = createCtx({
          email: 'user@example.test',
          password: 'newPassword9',
          code: '123456',
        });

        await authController.resetPassword(ctx);

        expect(ctx.status).toBe(429);
        expect(ctx.body).toEqual({ error: ContractError.TooManyAttempts.display });
      });
    });

    describe('When the reset succeeds', () => {
      it('should return 200 with a success message', async () => {
        authService.resetPassword.mockResolvedValue(ok(undefined));
        const ctx = createCtx({
          email: 'user@example.test',
          password: 'newPassword9',
          code: '123456',
        });

        await authController.resetPassword(ctx);

        expect(ctx.status).toBe(200);
        expect(ctx.body).toEqual({ message: 'Password reset successfully' });
      });
    });
  });
});
