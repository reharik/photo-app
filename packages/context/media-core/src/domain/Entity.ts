import type { ActorId, EntityId } from '../types/types';
import { serializeEntity } from './utilities/serializeAggregates';

export type ChildRow = {
  upsert: Entity<Record<string, unknown>>[];
  removed: Entity<Record<string, unknown>>[];
};

export type ChildEntities = Record<string, ChildRow>;

export type RemovedEntities = Record<string, string[]>;

export interface Persistable<TRecord> {
  toPersistence(): TRecord;
  persistenceState(): Record<string, unknown>;
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

  public persistenceState(): Record<string, unknown> {
    return {
      id: this.id(),
      ...this.props,
      ...this.exportAudit(),
    };
  }

  toPersistence(): TRecord {
    return serializeEntity(this);
  }
}
