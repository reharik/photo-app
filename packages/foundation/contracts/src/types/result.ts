import { ContractError } from '../enums/ContractError';

/**
 * OperationResult<T, E>
 *
 * Standard result type for write operations (command side).
 *
 * PATTERN
 * -------
 * We use OperationResult to model *expected business/domain failures* as data,
 * instead of throwing exceptions.
 *
 * - success → ok(value)
 * - failure → fail(error)
 *
 * WHERE IT IS USED
 * ----------------
 * - Returned from write services (always)
 * - Returned from Aggregate Root / domain methods when enforcing invariants
 *
 * WHERE IT IS NOT USED
 * --------------------
 * - Repositories: return plain values (e.g. Entity | null)
 * - Pure helpers/utilities: return plain values
 * - Infrastructure (DB, HTTP, etc): throw on failure
 *
 * ERROR HANDLING RULE
 * -------------------
 * - Expected domain/business failure → return fail(error)
 *   (e.g. invalid state, invariant violation, not allowed)
 *
 * - Unexpected/system failure → throw
 *   (e.g. DB down, network failure, programmer error)
 *
 * FLOW
 * ----
 * resolver → write service → domain (AR) → repo
 *
 * - Domain + service layers may propagate OperationResult
 * - Resolver is the boundary that converts OperationResult → API response
 *
 * GOAL
 * ----
 * Keep business failures explicit and type-safe,
 * while avoiding excessive Result plumbing in non-domain layers.
 */

export type OperationResult<T = void, E = ContractError> =
  { success: true; value: T } | { success: false; error: E };

export const ok = <T, E extends ContractError = ContractError>(
  value: T,
): OperationResult<T, E> => ({
  success: true,
  value,
});

export const fail = <T = void, E extends ContractError = ContractError>(
  error: E,
): OperationResult<T, E> => ({
  success: false,
  error,
});

export type BatchResult<TIn, TOut, E = ContractError> = {
  status: 'ok' | 'partial' | 'failed';
  succeeded: TOut[];
  failed: { item: TIn; error: E }[];
};

export const WriteToBatch = <TIn, TOut, E = ContractError>(
  batch: BatchResult<TIn, TOut, E>,
  result: OperationResult<TOut, E>,
  item: TIn,
) => {
  if (result.success) {
    batch.succeeded.push(result.value);
    batch.status = batch.failed.length > 0 ? 'partial' : 'ok';
  } else {
    batch.failed.push({ item, error: result.error });
    batch.status = batch.succeeded.length > 0 ? 'partial' : 'failed';
  }
};
