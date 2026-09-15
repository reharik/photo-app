import { jest } from '@jest/globals';
import type { Logger, ScopedLogger } from '@packages/infrastructure';

/**
 * The logger contract gained `child()` when logging split into the singleton
 * `logger` and the request-scoped `scopedLogger` (which is just `logger.child(logContext)`).
 * A bare object literal of jest.fn()s no longer satisfies it, so every unit test that
 * injects a fake logger builds one here.
 *
 * `child()` returns the same mock, so assertions work the same whether the code under
 * test logs directly or through a derived child.
 */
export const createMockLogger = () => {
  const child = jest.fn<(meta: Record<string, unknown>) => ScopedLogger>();

  const logger = {
    debug: jest.fn<Logger['debug']>(),
    info: jest.fn<Logger['info']>(),
    warn: jest.fn<Logger['warn']>(),
    http: jest.fn<Logger['http']>(),
    verbose: jest.fn<Logger['verbose']>(),
    /**
     * `error` is overloaded (message / +err / +meta / +err+meta). `jest.Mock<T>`
     * keeps only the last overload, which then fails to satisfy the 1-arg call, so
     * the mock is typed with a rest signature that every overload accepts instead.
     */
    error: jest.fn<(message: string, ...rest: unknown[]) => void>(),
    child,
  };

  // Assigned after construction so the self-reference does not make the literal's
  // inferred type circular. Doubles as the structural check against ScopedLogger.
  child.mockImplementation(() => logger);

  return logger;
};

export type MockLogger = ReturnType<typeof createMockLogger>;
