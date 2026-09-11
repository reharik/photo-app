/**
 * Builds a discriminated union from a map of arm name to that arm's extra fields.
 *
 * Saves writing the arms out by hand and gives every union in the codebase the same
 * discriminant (`kind`), so narrowing works the same way everywhere and adding an arm is one
 * line instead of a refactor.
 *
 * Use an arm's value of `void` for arms that carry no data beyond their name.
 *
 * @example
 * export type SendOutcome = Outcome<{
 *   sent: { messageId: string };
 *   failed: { reason: SendError };
 *   skipped: { reason: string };
 *   suppressed: void;
 * }>;
 *
 * // narrows correctly:
 * if (result.kind === 'sent') {
 *   logger.info('sent', result.messageId);
 * }
 *
 * @remarks
 * Choosing between this and `OperationResult`:
 *
 * - Two arms, plainly pass/fail, failure carries a `ContractError` — use `OperationResult`.
 *   It's the established vocabulary and the whole codebase already reads it.
 * - Three or more arms, or two whose names carry meaning beyond success and failure
 *   (`ready`/`skipped`, `retrying`/`exhausted`/`notOwned`) — use `Outcome`. Collapsing those
 *   into pass/fail loses the distinction and pushes it into a string the caller has to parse
 *   back out.
 *
 * Never discriminate on a boolean. `success: boolean` with optional fields alongside it is
 * the shape that forces a check the compiler can't help with, and it's what this exists to
 * replace.
 */
export type Outcome<M extends Record<string, object | void>> = {
  [K in keyof M]: M[K] extends void ? { kind: K } : { kind: K } & M[K];
}[keyof M];
