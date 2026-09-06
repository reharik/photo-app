// Aborts on first failure. Caller's trx rolls back.

import { ContractError, ok, OperationResult } from '@packages/contracts';

export type IndependentGroupResult<T, R> = {
  succeeded: { item: T; value: R }[];
  failed: { item: T; error: ContractError }[];
};

/**
 * Runs `fn` over `items` sequentially, aborting on the first failure.
 *
 * Use when the batch is ONE outcome from the user's point of view — there is no
 * coherent "you're 2 of 3 activated." Activating a pending user across their
 * albums is the canonical case: partial activation leaves them a member of some
 * albums and a stale pending invite on others, with no UI to surface it and no
 * path to retry.
 *
 * Sequential is deliberate, not an optimization gap. Parallel execution would run
 * every item before you learn any failed, leaving writes from items 0..n-1 sitting
 * in the transaction when item n fails. Running in order means nothing after the
 * failure executed, so the caller's rollback is clean rather than merely correct.
 * Do not "optimize" this to Promise.all.
 *
 * Returns the failing OperationResult unchanged, so `return result` propagates the
 * original ContractError up the stack without rewrapping. The caller is expected
 * to roll back its unit of work on failure — this helper does not manage
 * transactions.
 *
 * If you need to know WHICH item failed, include that context in `fn`'s own error.
 * If you need the failed items as data (to retry, or to show per-item errors), you
 * want `eachIndependently` instead — that's the signal you picked the wrong helper.
 *
 * @see eachIndependently for the partial-success counterpart.
 */
export const allOrNothing = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<OperationResult<R>>,
): Promise<OperationResult<R[]>> => {
  const values: R[] = [];
  for (const x of items) {
    const result = await fn(x);
    if (!result.success) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
};

/**
 * Runs `fn` over every item, collecting successes and failures into separate
 * buckets. Never short-circuits — every item gets its turn.
 *
 * Use when the batch is N INDEPENDENT outcomes the user can see and act on
 * individually. Inviting five people to an album is the canonical case: four
 * invites landing and one failing is a real, reportable result, not a broken
 * operation.
 *
 * The choice between this and `allOrNothing` is a domain question, not a
 * performance one. Ask whether the user perceives one outcome or many. Do not
 * pick by pattern-matching the nearest call site.
 *
 * Both buckets pair each result with the item that produced it, so nothing
 * depends on array position. Feed `failed` to `formatFailures` for logging —
 * log it even when the UI also displays the errors, since server logs answer
 * "what happened three days ago" and the UI only answers "what happened just now."
 *
 * ⚠️ DO NOT USE INSIDE A UNIT OF WORK IF `fn` WRITES.
 *
 * Partial success and a single transaction are incompatible. Every item here
 * shares the caller's transaction, so "3 succeeded, 2 failed" is a lie the moment
 * anything rolls back — either all five writes commit or none do, regardless of
 * what these buckets say. Worse, if a failing item wrote before it failed, that
 * write is still in the transaction and will commit alongside the "successes."
 *
 * This helper is safe when `fn` mutates in-memory domain state (the aggregate is
 * saved once afterward, so a failed item simply never mutated anything), or when
 * `fn` performs no writes at all. It is NOT safe when `fn` issues its own
 * repository writes and you intend the failures to not persist.
 *
 * If you need genuine per-item durability, each item needs its own transaction —
 * which is a different helper and a different conversation.
 *
 * @see allOrNothing for the atomic counterpart.
 */
export const eachIndependently = <T, R>(
  items: T[],
  fn: (item: T) => OperationResult<R>,
): IndependentGroupResult<T, R> => {
  const succeeded: { item: T; value: R }[] = [];
  const failed: { item: T; error: ContractError }[] = [];
  for (const item of items) {
    const result = fn(item);
    if (result.success) {
      succeeded.push({ item, value: result.value });
    } else {
      failed.push({ item, error: result.error });
    }
  }
  return { succeeded, failed };
};

export const formatFailures = <T>(
  failed: { item: T; error: ContractError }[],
  context: string,
  describe: (item: T) => string,
): string =>
  failed.length === 0
    ? ''
    : `${context}: ${failed.length} failed — ` +
      failed.map(({ item, error }) => `${describe(item)}: ${error.display}`).join('; ');
