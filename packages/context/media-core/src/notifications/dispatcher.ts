import { DomainEventHandler } from '../domain/domainEvents/eventPublisher';
import { NotificationStrategies, NotificationWriters } from '../generated/ioc-registry.types';

type Deps = {
  notificationStrategies: NotificationStrategies; // registered array (IoC)
  notificationWriters: NotificationWriters;
};

// The thin part: lookup strategy -> resolve ONCE -> uniform guards -> fan to
// the branches the strategy declares. No switch; adding a notification type is
// a new strategy, registered. This handler never changes.
export const build__NotificationDispatcher = ({
  notificationStrategies,
  notificationWriters,
}: Deps): DomainEventHandler => {
  const byKind = new Map(
    notificationStrategies.flatMap((s) => s.handles.map((k) => [k, s] as const)),
  );

  return {
    name: 'NotificationDispatcher',
    handles: [...byKind.keys()],
    processor: async (event) => {
      const strategy = byKind.get(event.kind);
      if (!strategy) return;

      const resolved = await strategy.resolve(event);

      // UNIFORM GUARDS — applied once, both branches inherit:
      //  - self-guard: never notify the actor (may already be enforced upstream in
      //    the emitter; harmless belt-and-suspenders here).
      //  - active-guard: never notify an inactive user.
      const recipients = resolved.recipients.filter((r) => r.id !== resolved.actorId);
      if (!recipients.length) return;

      const scoped = { ...resolved, recipients };
      await Promise.all(strategy.branches.map((branch) => notificationWriters[branch](scoped)));
    },
  };
};
