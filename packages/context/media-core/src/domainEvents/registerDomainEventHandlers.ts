import { Logger } from '@packages/infrastructure';
import { DomainEventHandlers } from '../generated/ioc-registry.types';
import { EventPublisher } from './eventPublisher';

export interface RegisterDomainEventHandlers {
  (): void;
}

type RegisterDomainEventHandlersDeps = {
  eventPublisher: EventPublisher;
  domainEventHandlers: DomainEventHandlers;
  logger: Logger;
};

export const build__RegisterDomainEventHandlers =
  ({
    eventPublisher,
    domainEventHandlers,
    logger,
  }: RegisterDomainEventHandlersDeps): RegisterDomainEventHandlers =>
  () => {
    const handlerNames = new Set();
    for (const handler of domainEventHandlers) {
      for (const kind of handler.handles) {
        handlerNames.add(kind);
        eventPublisher.register(kind, handler);
      }
    }
    logger.info(
      `[DomainEventPublisher] domainEventHandlers registered: ${[...handlerNames].join('\n')}`,
    );
  };
