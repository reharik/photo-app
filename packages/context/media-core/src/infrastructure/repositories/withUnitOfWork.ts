import { AwilixContainer } from 'awilix';

import type { IocScopeProvided } from '../../generated/ioc-registry.types.js';
import type { UnitOfWork } from './unitOfWork.js';

type UnitOfWorkRootCradle = { uow: UnitOfWork };
type UnitOfWorkScopeCradle<C extends UnitOfWorkRootCradle> = C & IocScopeProvided;

export type UnitOfWorkScope<C extends UnitOfWorkRootCradle = UnitOfWorkRootCradle> = {
  scope: AwilixContainer<UnitOfWorkScopeCradle<C>>;
  unitOfWork: UnitOfWork;
};

export const beginUnitOfWorkScope = async <C extends UnitOfWorkRootCradle>(
  container: AwilixContainer<C>,
): Promise<UnitOfWorkScope<C>> => {
  const scope = container.createScope() as AwilixContainer<UnitOfWorkScopeCradle<C>>;
  // `uow` is an ordinary SCOPED registration now — resolving it here materializes the
  // one instance this scope will hand to every repo resolved from it. The old
  // resolve('unitOfWork') + asValue re-registration existed only because the contract
  // was a transient exposed under a second key; both are gone with the rename.
  const unitOfWork = scope.resolve('uow');
  await unitOfWork.start();
  return { scope, unitOfWork };
};

export const endUnitOfWork = async (unitOfWork: UnitOfWork, success: boolean): Promise<void> => {
  await unitOfWork.complete(success);
};

export const withUnitOfWork = async <C extends UnitOfWorkRootCradle, T>(
  container: AwilixContainer<C>,
  fn: (scope: AwilixContainer<UnitOfWorkScopeCradle<C>>) => Promise<T>,
): Promise<T> => {
  const { scope, unitOfWork } = await beginUnitOfWorkScope(container);
  try {
    const result = await fn(scope);
    await endUnitOfWork(unitOfWork, true);
    return result;
  } catch (error) {
    await endUnitOfWork(unitOfWork, false);
    throw error;
  }
};
