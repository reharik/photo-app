import { ContractError } from '@packages/contracts';
import { WriteResult } from '../../types/types';

export const ok = <T, E extends ContractError = ContractError>(value: T): WriteResult<T, E> => ({
  success: true,
  value,
});

export const fail = <T = void, E extends ContractError = ContractError>(
  error: E,
): WriteResult<T, E> => ({
  success: false,
  error,
});

// comment
