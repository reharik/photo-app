import { Entity } from '../Entity';

export const isEntity = (value: unknown): value is Entity<Record<string, unknown>> => {
  return value instanceof Entity;
};

export class ContractViolationError extends Error {
  readonly code = 'CONTRACT_VIOLATION' as const;
  readonly data: { context: string; value: unknown };
  constructor(context: string, value: unknown) {
    super(`Contract violation in ${context}: unexpected ${String(value)}`);
    this.name = 'ContractViolationError';
    this.data = { context, value };
  }
}

// pairs the error with compile-time exhaustiveness — the `never` is the whole point
export function assertUnreachable(value: never, context: string): never {
  throw new ContractViolationError(context, value);
}
