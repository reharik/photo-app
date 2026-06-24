import { asValue, AwilixContainer, type NameAndRegistrationPair } from 'awilix';

import type { IocScopeProvided } from '../../generated/ioc-registry.types.js';
import type { UnitOfWork } from './unitOfWork.js';

type UnitOfWorkRootCradle = { unitOfWork: UnitOfWork };
type UnitOfWorkScopeCradle<C extends UnitOfWorkRootCradle> = C & IocScopeProvided;

export type UnitOfWorkScope<C extends UnitOfWorkRootCradle = UnitOfWorkRootCradle> = {
  scope: AwilixContainer<UnitOfWorkScopeCradle<C>>;
  unitOfWork: UnitOfWork;
};

export const beginUnitOfWorkScope = async <C extends UnitOfWorkRootCradle>(
  container: AwilixContainer<C>,
): Promise<UnitOfWorkScope<C>> => {
  const scope = container.createScope() as AwilixContainer<UnitOfWorkScopeCradle<C>>;
  const unitOfWork = scope.resolve('unitOfWork');
  await unitOfWork.start();
  scope.register({
    uow: asValue(unitOfWork),
  } as NameAndRegistrationPair<UnitOfWorkScopeCradle<C>>);
  return { scope, unitOfWork };
};

export const endUnitOfWork = async (unitOfWork: UnitOfWork, success: boolean): Promise<void> => {
  if (success) {
    await unitOfWork.commit();
  } else {
    await unitOfWork.rollback();
  }
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
