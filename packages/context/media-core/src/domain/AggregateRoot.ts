import { Entity } from './Entity';
import { DomainEvent } from './domainEvents/DomainEvent';

export abstract class AggregateRoot<
  TRecord extends Record<string, unknown>,
> extends Entity<TRecord> {
  public flushEvents(): DomainEvent[] {
    return collectEvents(this);
  }
}

const collectEvents = (ent: Entity<Record<string, unknown>>) => {
  const events = ent.pullEvents();
  for (const child of Object.values(ent.childEntities())) {
    for (const item of child.upsert) {
      if (item instanceof AggregateRoot) continue; // referenced foreign AR — not ours to drain
      events.push(...collectEvents(item));
    }
  }
  return events;
};
