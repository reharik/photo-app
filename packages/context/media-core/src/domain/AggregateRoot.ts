import { DomainEvent } from '../domainEvents/domainEvent';
import { DomainEntity } from './DomainEntity';

export abstract class AggregateRoot<
  TRecord extends Record<string, unknown>,
> extends DomainEntity<TRecord> {
  public flushEvents(): DomainEvent[] {
    return collectEvents(this);
  }
}

const collectEvents = (ent: DomainEntity<Record<string, unknown>>) => {
  const events = ent.pullEvents();
  for (const child of Object.values(ent.childEntities())) {
    for (const item of child.upsert) {
      if (item instanceof AggregateRoot) continue; // referenced foreign AR — not ours to drain
      events.push(...collectEvents(item));
    }
  }
  return events;
};
