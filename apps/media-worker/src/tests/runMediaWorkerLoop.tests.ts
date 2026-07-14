import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotificationCadence } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';

import type { Config } from '../config.js';
import { build__IntervalGate, type IntervalGate } from '../intervalGate';
import { build__RunMediaWorkerLoop, runWorkerTasksOnce } from '../runMediaWorkerLoop';
import type { WorkerTask, WorkerTaskOutcome } from '../types.js';

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

/** An always-due queue WorkerTask whose run() is the supplied mock. */
const makeTask = (
  name: string,
  order: number,
  run: jest.Mock<() => Promise<WorkerTaskOutcome>>,
): WorkerTask => ({ name, order, type: 'queue', run });

/**
 * Stub IntervalGate returning a fixed due-list — the loop resolves its tasks through
 * `intervalGate.getTasksDue()`, so the loop tests inject the due tasks this way (the
 * real due-gating is covered in the build__IntervalGate describe below).
 */
const makeGate = (tasks: WorkerTask[]): IntervalGate => ({ getTasksDue: () => tasks });

describe('build__RunMediaWorkerLoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('When a higher-priority task returns processed', () => {
    it('should restart the pass from the top before falling through to lower tasks', async () => {
      const deletionRun = jest
        .fn<() => Promise<WorkerTaskOutcome>>()
        .mockResolvedValueOnce('processed')
        .mockResolvedValue('idle');
      const imageRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10_000 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('deletion', 100, deletionRun),
          makeTask('image', 200, imageRun),
        ]),
      });

      const done = loop.start();
      for (let i = 0; i < 12; i++) {
        await Promise.resolve();
      }

      // Pass 1: deletion 'processed' → restart (image not reached).
      // Pass 2: deletion 'idle' → image 'idle' → no work → park on the poll sleep.
      expect(deletionRun).toHaveBeenCalledTimes(2);
      expect(imageRun).toHaveBeenCalledTimes(1);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When a lower-priority task returns processed', () => {
    it('should still poll again immediately without waiting for the interval', async () => {
      const deletionRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const imageRun = jest
        .fn<() => Promise<WorkerTaskOutcome>>()
        .mockResolvedValueOnce('processed')
        .mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10_000 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('deletion', 100, deletionRun),
          makeTask('image', 200, imageRun),
        ]),
      });

      const done = loop.start();
      for (let i = 0; i < 12; i++) {
        await Promise.resolve();
      }

      expect(imageRun).toHaveBeenCalledTimes(2);
      expect(deletionRun.mock.calls.length).toBeGreaterThanOrEqual(2);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When tasks stay idle', () => {
    it('should not log a heartbeat until many consecutive idle polls', async () => {
      const deletionRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const imageRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 100 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('deletion', 100, deletionRun),
          makeTask('image', 200, imageRun),
        ]),
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
      const deletionRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const imageRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 100 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('deletion', 100, deletionRun),
          makeTask('image', 200, imageRun),
        ]),
      });

      const done = loop.start();
      // Pump enough microtasks for the first pass to reach the lower-priority task.
      for (let i = 0; i < 12; i++) {
        await Promise.resolve();
      }
      expect(imageRun).toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(100);
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(100);
      await Promise.resolve();

      const totalCalls = deletionRun.mock.calls.length + imageRun.mock.calls.length;
      expect(totalCalls).toBeGreaterThanOrEqual(3);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;

      expect(logger.info).toHaveBeenCalledWith('Media worker stopped');
    });
  });

  describe('When a task throws', () => {
    it('should log the loop error and continue after the poll interval', async () => {
      const deletionRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const imageRun = jest
        .fn<() => Promise<WorkerTaskOutcome>>()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 50 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('deletion', 100, deletionRun),
          makeTask('image', 200, imageRun),
        ]),
      });

      const done = loop.start();
      // Reach the throw in pass 1 (deletion idle → image rejects).
      for (let i = 0; i < 6; i++) {
        await Promise.resolve();
      }
      expect(logger.error).toHaveBeenCalledWith('Media worker loop error', expect.any(Error));

      await jest.advanceTimersByTimeAsync(50);
      for (let i = 0; i < 6; i++) {
        await Promise.resolve();
      }

      const totalCalls = deletionRun.mock.calls.length + imageRun.mock.calls.length;
      expect(totalCalls).toBeGreaterThanOrEqual(2);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });
  });

  describe('When start is called twice while the loop is already running', () => {
    it('should only log Media worker started once', async () => {
      const deletionRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const imageRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        config: { mediaWorkerPollIntervalMs: 10 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('deletion', 100, deletionRun),
          makeTask('image', 200, imageRun),
        ]),
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

describe('runWorkerTasksOnce', () => {
  // runWorkerTasksOnce runs whatever due-list it is handed, in array order — the
  // due-gating (queue vs scheduled/cadence) now lives in IntervalGate.getTasksDue,
  // tested separately below.
  const task = (name: string, run: jest.Mock<() => Promise<WorkerTaskOutcome>>): WorkerTask => ({
    name,
    type: 'queue',
    run,
    order: 0,
  });

  it('runs tasks in order, stopping at the first that processes', async () => {
    const calls: string[] = [];
    const first = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
      calls.push('first');
      return 'idle';
    });
    const second = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
      calls.push('second');
      return 'processed';
    });

    const didWork = await runWorkerTasksOnce(
      [task('first', first), task('second', second)],
      createMockLogger(),
    );

    expect(didWork).toBe(true);
    expect(calls).toEqual(['first', 'second']);
  });

  it('breaks back to the top on processed without running lower-priority tasks', async () => {
    const first = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('processed');
    const second = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');

    const didWork = await runWorkerTasksOnce(
      [task('first', first), task('second', second)],
      createMockLogger(),
    );

    expect(didWork).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('treats a due task that returns idle as no work and falls through', async () => {
    const run = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');

    const didWork = await runWorkerTasksOnce([task('queue', run)], createMockLogger());

    expect(didWork).toBe(false);
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('build__IntervalGate', () => {
  const noopRun = (): jest.Mock<() => Promise<WorkerTaskOutcome>> =>
    jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');

  const queueTask = (name: string, order: number): WorkerTask => ({
    name,
    order,
    type: 'queue',
    run: noopRun(),
  });

  const scheduleTask = (name: string, order: number, cadence: NotificationCadence): WorkerTask => ({
    name,
    order,
    type: 'schedule',
    cadence,
    run: noopRun(),
  });

  // Long sweep windows so the gates are open on the first call and closed on the
  // immediate second call (elapsed ≈ 0 ms « interval).
  const config = { slowSweepIntervalMS: 1_000_000, fastSweepIntervalMS: 1_000_000 } as Config;

  it('always returns queue tasks and includes scheduled tasks only while their gate is open', () => {
    const gate = build__IntervalGate({
      logger: createMockLogger(),
      config,
      workerTasks: [
        queueTask('deletion', 100),
        scheduleTask('fast-sweep', 200, NotificationCadence.immediate),
        scheduleTask('slow-sweep', 300, NotificationCadence.batched),
      ],
    });

    // First call: both gates open (lastRun starts at 0) → all three, ordered by `order`.
    expect(gate.getTasksDue().map((t) => t.name)).toEqual(['deletion', 'fast-sweep', 'slow-sweep']);

    // Immediate second call: the sweep gates just fired, so only the always-due queue task remains.
    expect(gate.getTasksDue().map((t) => t.name)).toEqual(['deletion']);
  });
});
