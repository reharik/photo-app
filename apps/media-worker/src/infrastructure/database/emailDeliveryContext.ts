import { EmailDeliveryRepository, UnitOfWork } from '@packages/media-core';
import { ScopeRoot } from 'ioc-manifest';

/**
 * Scope root for the batcher's per-send delivery-record write — sibling of
 * [[MediaJobContext]] and [[MediaDeletionJobContext]], kept separate for the
 * same reason: one root per tree, no shared bag of everything scoped.
 *
 * Empty lbv (arity-1 `ScopeRoot`): nothing enters at the boundary. The root
 * settles its own transaction, so `start`/`finalize` delegate to `uow`.
 */
export interface EmailDeliveryContext {
  emailDeliveryRepository: EmailDeliveryRepository;
  start: () => Promise<void>;
  finalize: (ok: boolean) => Promise<void>;
}

type EmailDeliveryContextDeps = {
  emailDeliveryRepository: EmailDeliveryRepository;
  uow: UnitOfWork;
};

export const build__EmailDeliveryContext = ({
  emailDeliveryRepository,
  uow,
}: EmailDeliveryContextDeps): ScopeRoot<EmailDeliveryContext> => ({
  emailDeliveryRepository,
  start: uow.begin,
  finalize: uow.complete,
});
