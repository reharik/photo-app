import type { ContractError } from '@packages/contracts'; // use your real internal type here
import type { ContractError as GraphqlContractError } from '../generated/types.generated';

export const toContractErrorPayload = (error: ContractError): GraphqlContractError => ({
  code: error.code,
  message: error.display,
  field: undefined,
  category: error.category,
  retryable: error.retryable,
});
