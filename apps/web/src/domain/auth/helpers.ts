import { Operation } from '@packages/contracts';

export const hasPermission = (operations: Operation[], permission: Operation) => {
  return operations.includes(permission);
};
