import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services';
import { EntityId } from '../../types';

export type emailVerificationRow = {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: string;
  consumedAt: string | null;
  attemptCount: number;
};

export interface EmailVerificationRepository extends RequestScopeLifeCycle {
  getValidVerification: (email: string) => Promise<emailVerificationRow>;
  bumpValidationAttempts: (id: EntityId) => Promise<number>;
  completeConsumption: (id: EntityId) => Promise<void>;
}

type EmailVerificationRepositoryDeps = { uow: UnitOfWork };

export const build__EmailVerificationRepository = ({
  uow,
}: EmailVerificationRepositoryDeps): EmailVerificationRepository => ({
  getValidVerification: (email: string) => {
    return uow
      .db()('emailVerification')
      .where({ email, consumedAt: null })
      .andWhere('expiresAt', '>', uow.db().fn.now())
      .first<emailVerificationRow>();
  },
  bumpValidationAttempts: async (id: string) => {
    return uow.db()('emailVerification').where({ id }).increment('attemptCount', 1);
  },
  completeConsumption: (id: EntityId) => {
    return uow.db()('emailVerification').where({ id }).update({ consumedAt: uow.db().fn.now() });
  },
});
