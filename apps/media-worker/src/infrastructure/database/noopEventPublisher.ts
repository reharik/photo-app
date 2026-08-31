import { Logger } from '@packages/infrastructure';
import { DomainEvent, RequestScopeLifeCycle } from '@packages/media-core';

export interface EventPublisher extends RequestScopeLifeCycle {
  publish: (events: DomainEvent[]) => Promise<void>;
}

interface EventPublisherDeps {
  logger: Logger;
}

export const build__NoopEventPublisher = ({ logger }: EventPublisherDeps): EventPublisher => {
  return {
    publish: async (events: DomainEvent[]) => {
      if (events.length)
        logger.warn(
          `[Media-Worker] Media worker unitOfWork attempted to publish the following Domain Events: ${events.map((x) => x.kind).join(', ')}`,
        );
    },
  };
};
