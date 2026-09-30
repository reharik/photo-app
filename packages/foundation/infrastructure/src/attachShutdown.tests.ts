import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { attachShutdown, type ShutdownStep } from './attachShutdown';
import type { Logger } from './logger';

// Silence the BEGIN/COMPLETE markers, which go straight to fd 1.
jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('node:fs')>('node:fs'),
  writeSync: jest.fn(),
}));

type Handler = (arg?: unknown) => void;

const FORCE_EXIT_MS = 5000;

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

describe('attachShutdown', () => {
  let handlers: Map<string, Handler>;
  let log: string[];
  let exited: Promise<number>;
  let exit: jest.SpiedFunction<typeof process.exit>;
  let logger: Logger;

  const trigger = (event: string, arg?: unknown) => {
    const handler = handlers.get(event);
    if (!handler) throw new Error(`no handler registered for ${event}`);
    handler(arg);
  };

  /** A step that records its start and end around a real async boundary. */
  const step = (
    name: string,
    run: () => Promise<void> = () => Promise.resolve(),
  ): ShutdownStep => ({
    name,
    run: async () => {
      log.push(`${name}:start`);
      await run();
      log.push(`${name}:end`);
    },
  });

  const attach = (steps: ShutdownStep[]) =>
    attachShutdown({ tag: 'test', logger, forceExitMs: FORCE_EXIT_MS, steps });

  beforeEach(() => {
    jest.useFakeTimers();
    log = [];
    handlers = new Map();

    // Capture the handlers instead of registering them on the real process, so
    // nothing leaks between tests and emitting uncaughtException can't reach jest.
    jest.spyOn(process, 'on').mockImplementation(((event: string, handler: Handler) => {
      handlers.set(event, handler);
      return process;
    }) as typeof process.on);

    // The mocked exit RETURNS, unlike production. Everything after it keeps
    // running and the force-exit timer stays armed, so each test asserts the
    // FIRST exit and afterEach disarms the timer before it can fire a second.
    let resolveExit!: (code: number) => void;
    exited = new Promise((r) => (resolveExit = r));
    exit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      log.push(`exit:${code}`);
      resolveExit(code ?? 0);
    }) as typeof process.exit);

    logger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      http: jest.fn(),
      verbose: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    } as unknown as Logger;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('When SIGTERM is received', () => {
    it('should run every step in order, then exit 0', async () => {
      attach([step('a'), step('b'), step('c')]);

      trigger('SIGTERM');

      expect(await exited).toBe(0);
      expect(log).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'c:start', 'c:end', 'exit:0']);
      expect(exit).toHaveBeenCalledTimes(1);
    });
  });

  describe('When SIGINT is received', () => {
    it('should run every step, then exit 0', async () => {
      attach([step('a'), step('b')]);

      trigger('SIGINT');

      expect(await exited).toBe(0);
      expect(log).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'exit:0']);
    });
  });

  describe('When an uncaught exception occurs', () => {
    it('should log it, run every step, then exit 1', async () => {
      attach([step('a'), step('b')]);
      const error = new Error('boom');

      trigger('uncaughtException', error);

      expect(await exited).toBe(1);
      expect(log).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'exit:1']);
      expect(logger.error).toHaveBeenCalledWith('Uncaught exception', error);
    });
  });

  describe('When an unhandled rejection occurs', () => {
    it('should log it, run every step, then exit 1', async () => {
      attach([step('a'), step('b')]);
      const reason = new Error('rejected');

      trigger('unhandledRejection', reason);

      expect(await exited).toBe(1);
      expect(log).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'exit:1']);
      expect(logger.error).toHaveBeenCalledWith('Unhandled promise rejection', reason);
    });

    it('should wrap a non-Error reason for the logger', async () => {
      attach([step('a')]);

      trigger('unhandledRejection', 'just a string');

      expect(await exited).toBe(1);
      expect(logger.error).toHaveBeenCalledWith('Unhandled promise rejection', {
        reason: 'just a string',
      });
    });
  });

  describe('When a step throws', () => {
    it('should still run the later steps, then exit 1 even though the trigger was a signal', async () => {
      const failure = new Error('pool close failed');
      attach([step('a'), step('b', () => Promise.reject(failure)), step('c')]);

      trigger('SIGTERM');

      expect(await exited).toBe(1);
      expect(log).toEqual(['a:start', 'a:end', 'b:start', 'c:start', 'c:end', 'exit:1']);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[shutdown:test]'),
        failure,
      );
      expect(exit).toHaveBeenCalledTimes(1);
    });
  });

  describe('When a step hangs', () => {
    it('should force-exit 1 at the deadline without waiting for it', async () => {
      const hangStarted = deferred();
      attach([
        step('a'),
        step('hang', () => {
          hangStarted.resolve();
          return new Promise<void>(() => {});
        }),
        step('c'),
      ]);

      trigger('SIGTERM');
      await hangStarted.promise;

      jest.advanceTimersByTime(FORCE_EXIT_MS - 1);
      expect(exit).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);

      expect(await exited).toBe(1);
      expect(log).toEqual(['a:start', 'a:end', 'hang:start', 'exit:1']);
      expect(exit).toHaveBeenCalledTimes(1);
    });
  });

  describe('When a second trigger arrives during a shutdown', () => {
    it('should ignore it: steps run once and the first exit code stands', async () => {
      const gate = deferred();
      attach([step('a', () => gate.promise), step('b')]);

      trigger('SIGTERM');
      trigger('SIGINT');
      trigger('uncaughtException', new Error('late'));
      trigger('SIGTERM');
      gate.resolve();

      expect(await exited).toBe(0);
      expect(log).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'exit:0']);
      expect(exit).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        '[shutdown:test] SIGINT ignored, shutdown already in progress',
      );
    });
  });
});
