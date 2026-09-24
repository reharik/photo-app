import { Failure } from '@packages/contracts';
import type { ContractError as GraphqlContractError } from '../generated/types.generated';

export const toContractErrorPayload = (result: Failure): GraphqlContractError => ({
  code: result.error.code,
  context: result.context,
});
