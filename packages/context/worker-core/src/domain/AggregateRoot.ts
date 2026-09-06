import { Entity } from './Entity';

export abstract class AggregateRoot<
  TRecord extends Record<string, unknown>,
> extends Entity<TRecord> {}
