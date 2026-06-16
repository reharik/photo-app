import { WriteResult } from '@packages/contracts';
import { ContractError } from '../generated/types.generated';
import { toContractErrorPayload } from '../mappers/contractErrorMapper';

export type MutationPayload<T> = {
  data: T | undefined;
  errors: ContractError[];
};

export const writeResultToPayload = <T>(result: WriteResult<T>): MutationPayload<T> => {
  if (result.success) {
    return { data: result.value, errors: [] };
  }
  return { data: undefined, errors: [toContractErrorPayload(result.error)] };
};
