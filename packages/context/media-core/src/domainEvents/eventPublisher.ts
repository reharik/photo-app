import { Logger } from '@packages/infrastructure';
import { DomainEventHandlers } from '../generated/ioc-registry.types';
import { RequestScopeLifeCycle } from '../services/readServices/readServiceBaseType';
import { DomainEvent } from './DomainEvent';

export type DomainEventProcessor<K extends DomainEvent['kind'] = DomainEvent['kind']> = (
  event: Extract<DomainEvent, { kind: K }>,
) => Promise<void>;

export interface DomainEventHandler<
  K extends DomainEvent['kind'] = DomainEvent['kind'],
> extends RequestScopeLifeCycle {
  name: string;
  handles: K[];
  processor: DomainEventProcessor<K>;
}

export interface EventPublisher extends RequestScopeLifeCycle {
  publish: (events: DomainEvent[]) => Promise<void>;
}

interface EventPublisherDeps {
  logger: Logger;
  domainEventHandlers: DomainEventHandlers;
}

export const build__DomainEventPublisher = ({
  logger,
  domainEventHandlers,
}: EventPublisherDeps): EventPublisher => {
  /**
   * Built on first publish, NOT in the factory body. Reading a group member is what
   * constructs it, and the handlers reach back through uow → eventPublisher; doing it
   * here would be a resolution cycle (the container fails the whole write scope with
   * "A member of group \"domainEventHandlers\" was read during construction").
   * Holding the group itself is free — it stays inert until a member is read.
   */
  let handlers: Map<DomainEvent['kind'], DomainEventHandler[]> | undefined;
  const getHandlers = () => {
    if (!handlers) {
      handlers = new Map();
      for (const handler of domainEventHandlers) {
        for (const kind of handler.handles) {
          const list = handlers.get(kind) ?? [];
          list.push(handler);
          handlers.set(kind, list);
        }
      }
    }
    return handlers;
  };
  return {
    publish: async (events: DomainEvent[]) => {
      const handlerMap = getHandlers();
      for (const event of events) {
        const list = handlerMap.get(event.kind) ?? [];
        const handlerNameList = [];
        for (const handler of list) {
          handlerNameList.push(handler.name);
          try {
            await handler.processor(event);
          } catch (err) {
            logger.error('event handler failed', { kind: event.kind, handler: handler.name, err });
            // swallow — post-commit, work is durable, one handler failing ≠ failure
          }
        }
        logger.info(
          `[DomainEventPublisher] event: ${JSON.stringify(event, null, 4)} passed to [${handlerNameList.join(', ')}]`,
        );
      }
    },
  };
};
