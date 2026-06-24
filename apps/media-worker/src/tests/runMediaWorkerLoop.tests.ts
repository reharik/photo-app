import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Logger } from '@packages/infrastructure';

import type { RunNextMediaDeletionJob } from '../application/processNextMediaDeletionJob.js';
import type { RunNextMediaImageJob } from '../application/processNextMediaImageJob.js';
import type { Config } from '../config.js';
import { build__RunMediaWorkerLoop } from '../runMediaWorkerLoop';

type MockLogger = Logger & {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
  http: jest.Mock;
  verbose: jest.Mock;
};

const createMockLogger = (): MockLogger => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
});

describe('build__RunMediaWorkerLoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('When a deletion job returns processed', () => {
    it('should poll again immediately without waiting for the interval', async () => {
      const runNextMediaDeletionJob = jest
        .fn<RunNextMediaDeletionJob>()
        .mockResolvedValueOnce('processed')
        .mockResolvedValueOnce('idle');
      const runNextMediaImageJob = jest
        .fn<RunNextMediaImageJob>()
        .mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10_000 } as Config,
        logger,
        runNextMediaDeletionJob,
        runNextMediaImageJob,
      });

      const done = loop.start();
      for (let i = 0; i < 12; i++) {
        await Promise.resolve();
      }

      expect(runNextMediaDeletionJob).toHaveBeenCalledTimes(2);
      expect(runNextMediaImageJob).toHaveBeenCalledTimes(1);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When a job returns processed', () => {
    it('should poll again immediately without waiting for the interval', async () => {
      const runNextMediaDeletionJob = jest
        .fn<ProcessNextMediaDeletionJob>()
        .mockResolvedValue('idle');
      const runNextMediaImageJob = jest
        .fn<ProcessNextMediaImageJob>()
        .mockResolvedValueOnce('processed')
        .mockResolvedValueOnce('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10_000 } as Config,
        logger,
        runNextMediaDeletionJob,
        runNextMediaImageJob,
      });

      const done = loop.start();
      for (let i = 0; i < 12; i++) {
        await Promise.resolve();
      }

      expect(runNextMediaDeletionJob.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(runNextMediaImageJob).toHaveBeenCalledTimes(2);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When jobs stay idle', () => {
    it('should not log heartbeat until many consecutive idle polls', async () => {
      const runNextMediaDeletionJob = jest
        .fn<ProcessNextMediaDeletionJob>()
        .mockResolvedValue('idle');
      const runNextMediaImageJob = jest
        .fn<ProcessNextMediaImageJob>()
        .mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 100 } as Config,
        logger,
        runNextMediaDeletionJob,
        runNextMediaImageJob,
      });

      const done = loop.start();
      for (let i = 0; i < 8; i++) {
        await Promise.resolve();
      }

      const heartbeatCalls = logger.info.mock.calls.filter(
        (call) => call[0] === 'Media worker heartbeat: waiting for jobs',
      );
      expect(heartbeatCalls).toHaveLength(0);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });

    it('should poll on the configured interval until stopped', async () => {
      const runNextMediaDeletionJob = jest
        .fn<ProcessNextMediaDeletionJob>()
        .mockResolvedValue('idle');
      const runNextMediaImageJob = jest
        .fn<ProcessNextMediaImageJob>()
        .mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 100 } as Config,
        logger,
        runNextMediaDeletionJob,
        runNextMediaImageJob,
      });

      const done = loop.start();
      await Promise.resolve();
      expect(runNextMediaImageJob).toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(100);
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(100);
      await Promise.resolve();

      const totalCalls =
        runNextMediaDeletionJob.mock.calls.length + runNextMediaImageJob.mock.calls.length;
      expect(totalCalls).toBeGreaterThanOrEqual(3);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;

      expect(logger.info).toHaveBeenCalledWith('Media worker stopped');
    });
  });

  describe('When runNextMediaImageJob throws', () => {
    it('should log and continue after the poll interval', async () => {
      const runNextMediaDeletionJob = jest
        .fn<ProcessNextMediaDeletionJob>()
        .mockResolvedValue('idle');
      const runNextMediaImageJob = jest
        .fn<ProcessNextMediaImageJob>()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 50 } as Config,
        logger,
        runNextMediaDeletionJob,
        runNextMediaImageJob,
      });

      const done = loop.start();
      await Promise.resolve();

      await jest.advanceTimersByTimeAsync(50);
      await Promise.resolve();

      expect(logger.error).toHaveBeenCalledWith('Media worker loop error', expect.any(Error));
      const totalCalls =
        runNextMediaDeletionJob.mock.calls.length + runNextMediaImageJob.mock.calls.length;
      expect(totalCalls).toBeGreaterThanOrEqual(2);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When start is called twice while the loop is already running', () => {
    it('should only log Media worker started once', async () => {
      const runNextMediaDeletionJob = jest
        .fn<ProcessNextMediaDeletionJob>()
        .mockResolvedValue('idle');
      const runNextMediaImageJob = jest
        .fn<ProcessNextMediaImageJob>()
        .mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10 } as Config,
        logger,
        runNextMediaDeletionJob,
        runNextMediaImageJob,
      });

      const first = loop.start();
      loop.start();
      await Promise.resolve();

      const startedMessages = logger.info.mock.calls.filter((c) => c[0] === 'Media worker started');
      expect(startedMessages).toHaveLength(1);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await first;
    });
  });
});
