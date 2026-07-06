import { Logger } from '@packages/infrastructure';
import { DomainEventHandlers } from '../../generated/ioc-registry.types';
import { DomainEvent } from './DomainEvent';

export type DomainEventProcessor<K extends DomainEvent['kind'] = DomainEvent['kind']> = (
  event: Extract<DomainEvent, { kind: K }>,
) => Promise<void>;

export type DomainEventHandler<K extends DomainEvent['kind'] = DomainEvent['kind']> = {
  name: string;
  handles: K[];
  processor: DomainEventProcessor<K>;
};

export type EventPublisher = {
  register: (kind: DomainEvent['kind'], handler: DomainEventHandler) => void;
  publish: (events: DomainEvent[]) => Promise<void>;
};

interface EventPublisherDeps {
  logger: Logger;
}

export const build__EventPublisher = ({ logger }: EventPublisherDeps): EventPublisher => {
  const handlers = new Map<DomainEvent['kind'], DomainEventHandler[]>();

  return {
    register: (kind: DomainEvent['kind'], handler: DomainEventHandler) => {
      const list = handlers.get(kind) ?? [];
      logger.info(`[DomainEventPublisher] domainEventHandler registered: ${kind}`);
      list.push(handler);
      handlers.set(kind, list);
    },
    publish: async (events: DomainEvent[]) => {
      for (const event of events) {
        const list = handlers.get(event.kind) ?? [];
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

export const registerDomainEventHandlers = (
  eventPublisher: EventPublisher,
  domainEventHandlers: DomainEventHandlers,
) => {
  for (const handler of domainEventHandlers) {
    for (const kind of handler.handles) {
      eventPublisher.register(kind, handler);
    }
  }
};
