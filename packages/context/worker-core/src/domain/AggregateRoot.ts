import { Entity } from '@packages/contracts';

export abstract class AggregateRoot<
  TRecord extends Record<string, unknown>,
> extends Entity<TRecord> {}
