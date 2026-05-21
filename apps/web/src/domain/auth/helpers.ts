import { Operation } from '@packages/contracts';

export const hasPermission = (operations: Operation[], operation: Operation) => {
  return operations.includes(operation);
};
