import { Entity, type EntityId } from '@packages/contracts';
import { DomainEvent, DomainEventKind, EventPayload } from '../domainEvents/domainEvent';

export type DomainChildRow = {
  upsert: DomainEntity<Record<string, unknown>>[];
  removed: DomainEntity<Record<string, unknown>>[];
};

export type ChildDomainEntities = Record<string, DomainChildRow>;

export abstract class DomainEntity<
  TRecord extends Record<string, unknown>,
> extends Entity<TRecord> {
  _events: DomainEvent[] = [];

  childEntities(): ChildDomainEntities {
    return {};
  }

  protected recordEvent<K extends DomainEventKind>(
    kind: K,
    payload: Omit<EventPayload<K>, 'kind'>,
    actorId: EntityId,
  ): void {
    this._events.push({ ...payload, kind, occurredAt: new Date(), actorId } as Extract<
      DomainEvent,
      { kind: K }
    >);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }
}
