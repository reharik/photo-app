import { Logger } from '@packages/infrastructure';
import { DomainEventHandler } from '../domain/domainEvents/eventPublisher';
import { NotificationStrategies, NotificationWriters } from '../generated/ioc-registry.types';

type Deps = {
  notificationStrategies: NotificationStrategies; // registered array (IoC)
  notificationWriters: NotificationWriters;
  logger: Logger;
};

// The thin part: lookup strategy -> resolve ONCE -> uniform guards -> fan to
// the branches the strategy declares. No switch; adding a notification type is
// a new strategy, registered. This handler never changes.
export const build__NotificationDispatcher = ({
  notificationStrategies,
  notificationWriters,
  logger,
}: Deps): DomainEventHandler => {
  const byKind = new Map(
    notificationStrategies.flatMap((s) => s.handles.map((k) => [k, s] as const)),
  );

  return {
    name: 'NotificationDispatcher',
    handles: [...byKind.keys()],
    processor: async (event) => {
      const strategy = byKind.get(event.kind);
      if (!strategy) {
        logger.warn('[NotificationDispatcher] no strategy for event kind — dropping event', {
          eventKind: event.kind,
          actorId: event.actorId,
          occurredAt: event.occurredAt,
        });
        return;
      }
      logger.info('[NotificationDispatcher] dispatching event', {
        eventKind: event.kind,
        actorId: event.actorId,
        occurredAt: event.occurredAt,
        strategy: strategy.name,
      });

      const resolved = await strategy.resolve(event);

      // UNIFORM GUARDS — applied once, both branches inherit:
      //  - self-guard: never notify the actor (may already be enforced upstream in
      //    the emitter; harmless belt-and-suspenders here).
      //  - active-guard: never notify an inactive user.
      const recipients = resolved.recipients.filter((r) => r.id !== resolved.actorId);
      if (!recipients.length) {
        logger.warn('[NotificationDispatcher] no recipients after guards — dropping event', {
          eventKind: event.kind,
          eventUserId: 'userId' in event ? event.userId : undefined,
          actorId: resolved.actorId,
          resolvedRecipientIds: resolved.recipients.map((r) => r.id),
          kind: resolved.kind.value,
          containerId: resolved.containerId,
          subjectId: resolved.subjectId,
        });
        return;
      }

      const scoped = { ...resolved, recipients };
      await Promise.all(strategy.branches.map((branch) => notificationWriters[branch](scoped)));
      logger.info('[NotificationDispatcher] notification written', {
        eventKind: event.kind,
        kind: resolved.kind.value,
        recipientCount: recipients.length,
        recipientIds: recipients.map((r) => r.id),
        containerId: resolved.containerId,
        subjectId: resolved.subjectId,
        branches: strategy.branches,
      });
    },
  };
};
