/**
 * Runs `fn`, calling `onError` if it throws. The failure is swallowed.
 *
 * For work whose failure is survivable and whose result the caller doesn't need — writing a
 * telemetry row, emitting a metric, a best-effort cache warm. Returns `void` on purpose: if
 * you find yourself wanting a value back, you wanted `orElse`.
 *
 * Only reach for this when you have decided a failure is acceptable and can say why. It is
 * not a way to quiet a throw you haven't thought about — an unexamined `bestEffort` is a
 * swallowed bug with a log line in front of it. If "what should happen instead" has no
 * obvious answer, let it propagate.
 *
 * @example
 * await bestEffort(
 *   () => uow.inTransaction(() => persistDelivery(row, messageId)),
 *   (e) => logger.error('[sweep] delivery insert failed — telemetry gap, not resending', {
 *     sesMessageId: messageId,
 *     error: e,
 *   }),
 * );
 */
export const bestEffort = async (
  fn: () => Promise<unknown>,
  onError: (e: unknown) => void,
): Promise<void> => {
  try {
    await fn();
  } catch (e) {
    onError(e);
  }
};

/**
 * Runs `fn`, returning `onError`'s value if it throws.
 *
 * For work the caller needs a value from and can supply a fallback for. `onError` receives the
 * error and returns the substitute, so logging and the fallback live in one place rather than
 * being split across a catch block and a mutable `let` declared above it.
 *
 * Same caution as `bestEffort`: this is for failures you've decided to absorb. A fallback
 * chosen because you couldn't think of anything better is worse than a throw.
 *
 * @example
 * const counts = await orElse(
 *   () => uow.inTransaction(() => cleanUpOutcomes(outcomes)),
 *   (e) => {
 *     logger.error('[sweep] cleanup failed — rows not settled, next pass will re-send', e);
 *     return { deleted: 0, bumped: 0 };
 *   },
 * );
 */
export const orElse = async <T>(fn: () => Promise<T>, onError: (e: unknown) => T): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    return onError(e);
  }
};
