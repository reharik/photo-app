import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SweepCadence } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type { UnitOfWork } from '@packages/media-core';

import type { Config } from '../config.js';
import type { WorkerTasks } from '../generated/ioc-registry.types.js';
import { build__IntervalGate, type IntervalGate } from '../intervalGate';
import { build__RunMediaWorkerLoop, runAllTasks, runWorkerTasksOnce } from '../runMediaWorkerLoop';
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

/**
 * Pull the reported error text out of a logger.error payload. The loop's catch-all
 * currently serializes with `{ err: String(e) }`; passing the Error itself is the
 * shape that preserves a stack. Assert on the text so the test pins the behaviour
 * under test — the failure surfaced and the loop kept polling — and not the
 * payload shape.
 */
const reportedErrorText = (payload: unknown): string =>
  payload instanceof Error
    ? payload.message
    : String((payload as { err?: unknown })?.err ?? payload);

/** An always-due queue WorkerTask whose run() is the supplied mock. */
const makeTask = (
  name: string,
  order: number,
  run: jest.Mock<() => Promise<WorkerTaskOutcome>>,
): WorkerTask => ({ name, order, type: 'queue', run });

/** A scheduled (sweep) WorkerTask whose run() is the supplied mock. */
const makeSweep = (
  name: string,
  cadence: SweepCadence,
  run: jest.Mock<() => Promise<WorkerTaskOutcome>>,
): WorkerTask => ({ name, type: 'schedule', cadence, run });

/**
 * The loop is the safety net for task transactions: a task that returns (or throws)
 * with a boundary still open must not carry it into the next task, so the loop
 * settles the uow after every run. `settle(false)` is a no-op when nothing is open,
 * which is the normal case — tasks that own a boundary complete it themselves.
 */
const createFakeUow = () => {
  const settlements: boolean[] = [];
  const uow = {
    join: async () => {},
    beginIsolatedOnly: async () => {},
    db: () => {
      throw new Error('db() is not available in this unit test');
    },
    complete: async () => {},
    settle: async (ok: boolean) => {
      settlements.push(ok);
    },
    collectEvents: () => {},
    flagRollbackOnly: () => {},
  } as unknown as UnitOfWork;
  return { uow, settlements };
};

/** Yield N microtask turns so the (timer-parked) loop coroutine can advance. */
const pump = async (turns: number): Promise<void> => {
  for (let i = 0; i < turns; i++) {
    await Promise.resolve();
  }
};

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
        uow: createFakeUow().uow,
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
        uow: createFakeUow().uow,
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
        uow: createFakeUow().uow,
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
        uow: createFakeUow().uow,
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
        uow: createFakeUow().uow,
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
      // The task's own runner logs the throw with a stack, then rethrows so the
      // loop's catch-all reports it and schedules the retry sleep.
      expect(logger.error).toHaveBeenCalledWith(
        '[mediaWorker-run_once] task "image" threw',
        expect.any(Error),
      );
      const loopErrors = logger.error.mock.calls.filter((c) => c[0] === 'Media worker loop error');
      expect(loopErrors).toHaveLength(1);
      expect(reportedErrorText(loopErrors[0][1])).toContain('boom');

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
        uow: createFakeUow().uow,
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

  describe('Two-phase pass: queue segment first, sweeps only when the queue is drained', () => {
    it('defers sweeps while the queue processes, then runs them once the queue goes idle', async () => {
      const calls: string[] = [];
      let queueCalls = 0;
      const queueRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
        queueCalls += 1;
        calls.push('queue');
        return queueCalls === 1 ? 'processed' : 'idle';
      });
      const sweepRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
        calls.push('sweep');
        return 'idle';
      });
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        uow: createFakeUow().uow,
        config: { mediaWorkerPollIntervalMs: 10_000 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('queue', 100, queueRun),
          makeSweep('sweep', SweepCadence.slow, sweepRun),
        ]),
      });

      const done = loop.start();
      await pump(30);

      // Pass 1: queue 'processed' → restart WITHOUT running the sweep.
      // Pass 2: queue 'idle' → sweep segment runs → sweep 'idle' → park on the poll sleep.
      expect(calls).toEqual(['queue', 'queue', 'sweep']);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });

    it('runs every due sweep in the pass — an earlier sweep processing does not skip later ones — and re-polls immediately after sweep work', async () => {
      const calls: string[] = [];
      const queueRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
        calls.push('queue');
        return 'idle';
      });
      let sweepACalls = 0;
      const sweepARun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
        sweepACalls += 1;
        calls.push('sweepA');
        return sweepACalls === 1 ? 'processed' : 'idle';
      });
      const sweepBRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
        calls.push('sweepB');
        return 'idle';
      });
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        uow: createFakeUow().uow,
        config: { mediaWorkerPollIntervalMs: 10_000 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('queue', 100, queueRun),
          makeSweep('sweepA', SweepCadence.slow, sweepARun),
          makeSweep('sweepB', SweepCadence.fast, sweepBRun),
        ]),
      });

      const done = loop.start();
      await pump(40);

      // Pass 1: queue idle → sweepA 'processed' AND sweepB still runs (no early
      // return inside the sweep segment) → sweep work → immediate re-poll, no sleep.
      // Pass 2: all idle → park. Both passes happen without any timer advance.
      expect(calls).toEqual(['queue', 'sweepA', 'sweepB', 'queue', 'sweepA', 'sweepB']);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
    });

    it('contains a throwing sweep: logs it, still runs the remaining sweeps, and does not surface a loop error', async () => {
      const queueRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const sweepARun = jest
        .fn<() => Promise<WorkerTaskOutcome>>()
        .mockRejectedValueOnce(new Error('sweep boom'))
        .mockResolvedValue('idle');
      const sweepBRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');
      const logger = createMockLogger();

      const loop = build__RunMediaWorkerLoop({
        uow: createFakeUow().uow,
        config: { mediaWorkerPollIntervalMs: 10_000 } as Config,
        logger,
        intervalGate: makeGate([
          makeTask('queue', 100, queueRun),
          makeSweep('sweepA', SweepCadence.slow, sweepARun),
          makeSweep('sweepB', SweepCadence.fast, sweepBRun),
        ]),
      });

      const done = loop.start();
      await pump(30);

      expect(logger.error).toHaveBeenCalledWith(
        '[mediaWorker-run_all] task "sweepA" threw',
        expect.any(Error),
      );
      expect(sweepBRun).toHaveBeenCalled();
      const loopErrors = logger.error.mock.calls.filter((c) => c[0] === 'Media worker loop error');
      expect(loopErrors).toHaveLength(0);

      loop.stop();
      await jest.runOnlyPendingTimersAsync();
      await done;
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

    const { uow, settlements } = createFakeUow();
    const didWork = await runWorkerTasksOnce(
      [task('first', first), task('second', second)],
      createMockLogger(),
      uow,
    );

    expect(didWork).toBe(true);
    expect(calls).toEqual(['first', 'second']);
    // One settle per task run: a task must never inherit the previous task's
    // open boundary.
    expect(settlements).toEqual([false, false]);
  });

  it('breaks back to the top on processed without running lower-priority tasks', async () => {
    const first = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('processed');
    const second = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');

    const didWork = await runWorkerTasksOnce(
      [task('first', first), task('second', second)],
      createMockLogger(),
      createFakeUow().uow,
    );

    expect(didWork).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('treats a due task that returns idle as no work and falls through', async () => {
    const run = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');

    const didWork = await runWorkerTasksOnce(
      [task('queue', run)],
      createMockLogger(),
      createFakeUow().uow,
    );

    expect(didWork).toBe(false);
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('runAllTasks', () => {
  // The sweep segment: every task in the list runs to completion each pass —
  // no early return, and one task's failure never blocks the others.

  it('runs every task — a processed outcome does not stop later tasks', async () => {
    const calls: string[] = [];
    const first = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
      calls.push('first');
      return 'processed';
    });
    const second = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
      calls.push('second');
      return 'idle';
    });

    const didWork = await runAllTasks(
      [
        makeSweep('first', SweepCadence.slow, first),
        makeSweep('second', SweepCadence.fast, second),
      ],
      createMockLogger(),
      createFakeUow().uow,
    );

    expect(didWork).toBe(true);
    expect(calls).toEqual(['first', 'second']);
  });

  it('returns false when every task is idle', async () => {
    const run = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('idle');

    const didWork = await runAllTasks(
      [makeSweep('sweep', SweepCadence.slow, run)],
      createMockLogger(),
      createFakeUow().uow,
    );

    expect(didWork).toBe(false);
  });

  it('logs a throwing task and continues to the rest instead of aborting', async () => {
    const boom = jest.fn<() => Promise<WorkerTaskOutcome>>().mockRejectedValue(new Error('boom'));
    const after = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('processed');
    const logger = createMockLogger();

    const { uow, settlements } = createFakeUow();
    const didWork = await runAllTasks(
      [makeSweep('boom', SweepCadence.slow, boom), makeSweep('after', SweepCadence.fast, after)],
      logger,
      uow,
    );

    expect(logger.error).toHaveBeenCalledWith(
      '[mediaWorker-run_all] task "boom" threw',
      expect.any(Error),
    );
    expect(after).toHaveBeenCalledTimes(1);
    expect(didWork).toBe(true);
    // The thrower's boundary is rolled back before the next sweep starts, not
    // left for it to trip over.
    expect(settlements).toEqual([false, false]);
  });

  it('returns false for an empty list', async () => {
    await expect(runAllTasks([], createMockLogger(), createFakeUow().uow)).resolves.toBe(false);
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

  const scheduleTask = (
    name: string,
    cadence: SweepCadence,
    run: jest.Mock<() => Promise<WorkerTaskOutcome>> = noopRun(),
  ): WorkerTask => ({
    name,
    type: 'schedule',
    cadence,
    run,
  });

  // Long sweep windows so the gates are open on the first call (lastRun starts
  // at 0) and stay closed once stamped (elapsed ≈ 0 ms « interval).
  const config = { slowSweepIntervalMS: 1_000_000, fastSweepIntervalMS: 1_000_000 } as Config;

  // The generated WorkerTasks union narrows each task's `name` to its real
  // literal; the gate only relies on the WorkerTask shape, so fakes with
  // test names are cast through it.
  const gateWith = (tasks: WorkerTask[], cfg: Config = config): IntervalGate =>
    build__IntervalGate({
      logger: createMockLogger(),
      config: cfg,
      workerTasks: tasks as unknown as WorkerTasks,
    });

  it('returns queue tasks first (sorted by order), then due slow tasks, then due fast tasks', () => {
    const gate = gateWith([
      queueTask('deletion', 100),
      scheduleTask('fast-sweep', SweepCadence.fast),
      scheduleTask('slow-sweep', SweepCadence.slow),
    ]);

    // Both gates open at boot (lastRun starts at 0) → all three, in structural
    // order. `order` no longer ranks scheduled tasks — only queue tasks carry one.
    expect(gate.getTasksDue().map((t) => t.name)).toEqual(['deletion', 'slow-sweep', 'fast-sweep']);
  });

  it('keeps a due sweep due across calls until it actually RUNS — gate-open does not stamp', () => {
    // Regression: the gate used to stamp lastRun when the gate opened, so a due
    // sweep skipped by a busy queue pass was charged for a slot it never ran.
    const gate = gateWith([
      queueTask('deletion', 100),
      scheduleTask('slow-sweep', SweepCadence.slow),
    ]);

    expect(gate.getTasksDue().map((t) => t.name)).toEqual(['deletion', 'slow-sweep']);
    // Immediate second and third calls: the sweep never ran, so it is still due.
    expect(gate.getTasksDue().map((t) => t.name)).toEqual(['deletion', 'slow-sweep']);
    expect(gate.getTasksDue().map((t) => t.name)).toEqual(['deletion', 'slow-sweep']);
  });

  it('closes only the sweep set whose task ran', async () => {
    const gate = gateWith([
      scheduleTask('slow-sweep', SweepCadence.slow),
      scheduleTask('fast-sweep', SweepCadence.fast),
    ]);

    const due = gate.getTasksDue();
    expect(due.map((t) => t.name)).toEqual(['slow-sweep', 'fast-sweep']);

    await due.find((t) => t.name === 'slow-sweep')!.run();

    // Slow just ran → stamped closed; fast never ran → still due.
    expect(gate.getTasksDue().map((t) => t.name)).toEqual(['fast-sweep']);
  });

  it('stamps at run COMPLETION, not at invocation', async () => {
    let resolveRun!: (outcome: WorkerTaskOutcome) => void;
    const inFlightRun = jest
      .fn<() => Promise<WorkerTaskOutcome>>()
      .mockReturnValue(new Promise<WorkerTaskOutcome>((res) => (resolveRun = res)));
    const gate = gateWith([scheduleTask('slow-sweep', SweepCadence.slow, inFlightRun)]);

    const [slow] = gate.getTasksDue();
    const inFlight = slow.run();

    // Still un-stamped while the run is in flight.
    expect(gate.getTasksDue().map((t) => t.name)).toEqual(['slow-sweep']);

    resolveRun('idle');
    await inFlight;

    expect(gate.getTasksDue()).toEqual([]);
  });

  it('stamps even when the sweep run rejects, so a crashing sweep cannot hot-loop', async () => {
    const rejectingRun = jest
      .fn<() => Promise<WorkerTaskOutcome>>()
      .mockRejectedValue(new Error('boom'));
    const gate = gateWith([scheduleTask('slow-sweep', SweepCadence.slow, rejectingRun)]);

    const [slow] = gate.getTasksDue();
    await expect(slow.run()).rejects.toThrow('boom');

    expect(gate.getTasksDue()).toEqual([]);
  });

  it('reopens a sweep gate after its interval elapses', async () => {
    jest.useFakeTimers();
    try {
      const gate = gateWith([scheduleTask('slow-sweep', SweepCadence.slow)], {
        slowSweepIntervalMS: 1_000,
        fastSweepIntervalMS: 1_000,
      } as Config);

      const [slow] = gate.getTasksDue();
      await slow.run();
      expect(gate.getTasksDue()).toEqual([]);

      jest.setSystemTime(Date.now() + 1_001);

      expect(gate.getTasksDue().map((t) => t.name)).toEqual(['slow-sweep']);
    } finally {
      jest.useRealTimers();
    }
  });

  it('the stamping wrapper preserves the task outcome and name', async () => {
    const processedRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('processed');
    const gate = gateWith([scheduleTask('slow-sweep', SweepCadence.slow, processedRun)]);

    const [slow] = gate.getTasksDue();
    expect(slow.name).toBe('slow-sweep');
    await expect(slow.run()).resolves.toBe('processed');
  });
});

describe('IntervalGate + loop composition', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('a sweep due during a queue burst runs once the queue drains — exactly once, not lost, not repeated', async () => {
    // Regression for the composed bug: stamp-at-open + early return meant a queue
    // burst at gate-open time consumed the sweep's slot without running it.
    let queueCalls = 0;
    const queueRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockImplementation(async () => {
      queueCalls += 1;
      return queueCalls <= 2 ? 'processed' : 'idle';
    });
    const sweepRun = jest.fn<() => Promise<WorkerTaskOutcome>>().mockResolvedValue('processed');
    const logger = createMockLogger();

    const gate = build__IntervalGate({
      logger,
      config: { slowSweepIntervalMS: 1_000_000, fastSweepIntervalMS: 1_000_000 } as Config,
      workerTasks: [
        makeTask('image', 100, queueRun),
        makeSweep('slow-sweep', SweepCadence.slow, sweepRun),
      ] as unknown as WorkerTasks,
    });
    const loop = build__RunMediaWorkerLoop({
      uow: createFakeUow().uow,
      config: { mediaWorkerPollIntervalMs: 10_000 } as Config,
      logger,
      intervalGate: gate,
    });

    const done = loop.start();
    await pump(60);

    // Pass 1+2: queue 'processed', sweep due-but-deferred (and NOT charged).
    // Pass 3: queue idle → sweep finally runs ('processed') → immediate re-poll.
    // Pass 4: gate now stamped closed, queue idle → park on the poll sleep.
    expect(sweepRun).toHaveBeenCalledTimes(1);
    expect(queueRun).toHaveBeenCalledTimes(4);

    loop.stop();
    await jest.runOnlyPendingTimersAsync();
    await done;
  });
});
