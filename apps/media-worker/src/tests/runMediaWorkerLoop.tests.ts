import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
import { build__RunMediaWorkerLoop } from '../runMediaWorkerLoop';

describe('build__RunMediaWorkerLoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('When a deletion job returns processed', () => {
    it('should poll again immediately without waiting for the interval', async () => {
      const processNextMediaDeletionJob = jest
        .fn()
        .mockResolvedValueOnce('processed')
        .mockResolvedValueOnce('idle');
      const processNextMediaImageJob = jest.fn().mockResolvedValue('idle');
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
      };

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10_000 } as IocGeneratedCradle['config'],
        logger,
        processNextMediaDeletionJob,
        processNextMediaImageJob,
      } as IocGeneratedCradle);

      const done = loop.start();
      for (let i = 0; i < 12; i++) {
        await Promise.resolve();
      }

      expect(processNextMediaDeletionJob).toHaveBeenCalledTimes(2);
      expect(processNextMediaImageJob).toHaveBeenCalledTimes(1);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When a job returns processed', () => {
    it('should poll again immediately without waiting for the interval', async () => {
      const processNextMediaDeletionJob = jest.fn().mockResolvedValue('idle');
      const processNextMediaImageJob = jest
        .fn()
        .mockResolvedValueOnce('processed')
        .mockResolvedValueOnce('idle');
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
      };

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10_000 } as IocGeneratedCradle['config'],
        logger,
        processNextMediaDeletionJob,
        processNextMediaImageJob,
      } as IocGeneratedCradle);

      const done = loop.start();
      for (let i = 0; i < 12; i++) {
        await Promise.resolve();
      }

      expect(processNextMediaDeletionJob.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(processNextMediaImageJob).toHaveBeenCalledTimes(2);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When jobs stay idle', () => {
    it('should log a debug message on each idle poll', async () => {
      const processNextMediaDeletionJob = jest.fn().mockResolvedValue('idle');
      const processNextMediaImageJob = jest.fn().mockResolvedValue('idle');
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
      };

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 100 } as IocGeneratedCradle['config'],
        logger,
        processNextMediaDeletionJob,
        processNextMediaImageJob,
      } as IocGeneratedCradle);

      const done = loop.start();
      for (let i = 0; i < 8; i++) {
        await Promise.resolve();
      }

      expect(logger.debug).toHaveBeenCalledWith(
        'Media worker poll: no jobs available',
        expect.objectContaining({ idleCycles: 1 }),
      );

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });

    it('should poll on the configured interval until stopped', async () => {
      const processNextMediaDeletionJob = jest.fn().mockResolvedValue('idle');
      const processNextMediaImageJob = jest.fn().mockResolvedValue('idle');
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
      };

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 100 } as IocGeneratedCradle['config'],
        logger,
        processNextMediaDeletionJob,
        processNextMediaImageJob,
      } as IocGeneratedCradle);

      const done = loop.start();
      await Promise.resolve();
      expect(processNextMediaImageJob).toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(100);
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(100);
      await Promise.resolve();

      const totalCalls =
        processNextMediaDeletionJob.mock.calls.length + processNextMediaImageJob.mock.calls.length;
      expect(totalCalls).toBeGreaterThanOrEqual(3);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;

      expect(logger.info).toHaveBeenCalledWith('Media worker stopped');
    });
  });

  describe('When processNextMediaImageJob throws', () => {
    it('should log and continue after the poll interval', async () => {
      const processNextMediaDeletionJob = jest.fn().mockResolvedValue('idle');
      const processNextMediaImageJob = jest
        .fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue('idle');
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
      };

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 50 } as IocGeneratedCradle['config'],
        logger,
        processNextMediaDeletionJob,
        processNextMediaImageJob,
      } as IocGeneratedCradle);

      const done = loop.start();
      await Promise.resolve();

      await jest.advanceTimersByTimeAsync(50);
      await Promise.resolve();

      expect(logger.error).toHaveBeenCalledWith('Media worker loop error', expect.any(Error));
      const totalCalls =
        processNextMediaDeletionJob.mock.calls.length + processNextMediaImageJob.mock.calls.length;
      expect(totalCalls).toBeGreaterThanOrEqual(2);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When start is called twice while the loop is already running', () => {
    it('should only log Media worker started once', async () => {
      const processNextMediaDeletionJob = jest.fn().mockResolvedValue('idle');
      const processNextMediaImageJob = jest.fn().mockResolvedValue('idle');
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
      };

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10 } as IocGeneratedCradle['config'],
        logger,
        processNextMediaDeletionJob,
        processNextMediaImageJob,
      } as IocGeneratedCradle);

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
