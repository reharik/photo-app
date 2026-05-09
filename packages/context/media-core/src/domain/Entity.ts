import type { ActorId, EntityId } from '../types/types';
import { serializeEntity } from './utilities/serializeAggregates';

export type ChildEntities = Record<
  string,
  Entity<Record<string, unknown>> | Entity<Record<string, unknown>>[]
>;

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

export abstract class Entity<
  TRecord extends Record<string, unknown>,
> implements Persistable<TRecord> {
  readonly #id: EntityId;

  #createdAt: Date;
  #updatedAt: Date;
  #createdBy: ActorId;
  #updatedBy: ActorId;
  protected abstract props: Record<string, unknown>;

  protected constructor(id: EntityId, actorId: ActorId) {
    const now = new Date();

    this.#id = id;
    this.#createdAt = now;
    this.#updatedAt = now;
    this.#createdBy = actorId;
    this.#updatedBy = actorId;
  }

  protected rehydrateAudit(audit: AuditRecord): void {
    this.#createdAt = audit.createdAt;
    this.#updatedAt = audit.updatedAt;
    this.#createdBy = audit.createdBy;
    this.#updatedBy = audit.updatedBy;
  }

  touch(actorId: ActorId): void {
    this.#updatedAt = new Date();
    this.#updatedBy = actorId;
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

  protected childEntities(): ChildEntities {
    return {};
  }

  public persistenceState(): Record<string, unknown> {
    return {
      id: this.id(),
      ...this.props,
      ...this.exportAudit(),
      ...this.childEntities(),
    };
  }

  toPersistence(): TRecord {
    return serializeEntity(this);
  }
}
