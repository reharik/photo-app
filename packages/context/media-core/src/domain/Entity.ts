import type { ActorId, EntityId } from '../types/types';
import { DomainEvent, DomainEventKind, EventPayload } from './domainEvents/DomainEvent';
import { serializeValue } from './utilities/serializeAggregates';

export type ChildRow = {
  upsert: Entity<Record<string, unknown>>[];
  removed: Entity<Record<string, unknown>>[];
};

export type ChildEntities = Record<string, ChildRow>;

export type RemovedEntities = Record<string, string[]>;

export interface Persistable<TRecord> {
  toPersistence(): TRecord;
}

export type AuditRecord = {
  createdAt: Date;
  updatedAt: Date;
  createdBy: ActorId;
  updatedBy: ActorId;
};

export type VOCollection<T = Record<string, unknown>> = {
  tableName: string;
  upsert: T[]; // rows ready to insert/upsert
  removed: Record<string, unknown>[]; // where-clauses to delete by
  conflictKeys: string[]; // columns for onConflict
};

export abstract class Entity<
  TRecord extends Record<string, unknown>,
> implements Persistable<TRecord> {
  readonly #id: EntityId;
  _isNew: boolean;
  _isDirty: boolean;
  _tableName: string;
  _events: DomainEvent[] = [];

  #createdAt: Date;
  #updatedAt: Date;
  #createdBy: ActorId;
  #updatedBy: ActorId;
  protected abstract props: Record<string, unknown>;

  protected constructor(id: EntityId | undefined, actorId: ActorId, tableName: string) {
    const now = new Date();
    this.#id = id ?? crypto.randomUUID();
    this.#createdAt = now;
    this.#updatedAt = now;
    this.#createdBy = actorId;
    this.#updatedBy = actorId;
    this._isNew = id == null;
    this._isDirty = false;
    this._tableName = tableName;
  }

  protected rehydrateAudit(audit: AuditRecord): void {
    this.#createdAt = audit.createdAt;
    this.#updatedAt = audit.updatedAt;
    this.#createdBy = audit.createdBy;
    this.#updatedBy = audit.updatedBy;
    this._isDirty = false;
    this._isNew = false;
  }

  touch(actorId: ActorId): void {
    this.#updatedAt = new Date();
    this.#updatedBy = actorId;
    this._isDirty = true;
  }

  tableName(): string {
    return this._tableName;
  }

  protected exportAudit(): AuditRecord {
    return {
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
      createdBy: this.#createdBy,
      updatedBy: this.#updatedBy,
    };
  }

  public id(): EntityId {
    return this.#id;
  }

  public isNew(): boolean {
    return this._isNew;
  }

  public isDirty(): boolean {
    return this._isDirty;
  }

  childEntities(): ChildEntities {
    return {};
  }

  VOs(): Record<string, VOCollection> {
    return {};
  }
  /**
   * Final persisted record. Repo-facing — don't override.
   */
  toPersistence(): TRecord {
    return serializeValue({
      id: this.id(),
      ...this.props,
      ...this.exportAudit(),
      ...this.persistenceExtras(), // spreads last: adds or replaces values only
    }) as TRecord;
  }

  /**
   * Extra fields to persist beyond id/props/audit. Default: none.
   *
   * Override to ADD a derived field, or REPLACE a prop's value (key must
   * already exist in props). Returned keys win (spread last).
   *
   * Can't remove a key or reshape the base here. If you need that: the field
   * probably shouldn't be in `props`, or rename the prop to match its column
   * (a phantom column means prop name ≠ column name). Only if you truly need
   * to drop keys should you stop spreading props above and build the map by hand.
   */
  protected persistenceExtras(): Record<string, unknown> {
    return {};
  }

  protected recordEvent<K extends DomainEventKind>(
    kind: K,
    payload: Omit<EventPayload<K>, 'kind'>,
    actorId: EntityId,
  ): void {
    this._events.push({ ...payload, kind, occurredAt: new Date(), actorId } as DomainEvent);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }
}
