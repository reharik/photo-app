import type { ApolloClient, OperationVariables } from '@apollo/client';
import { AppResult, ExecuteMutationArgs, fail, MutationPayload, ok } from '../errors/errorTypes';
import { mapContractError, mapSystemError, mapUnknownSystemError } from '../errors/mapToError';
export const normalizeMutationPayload = <TData>(
  payload: MutationPayload<TData> | null | undefined,
): AppResult<TData> => {
  if (!payload) {
    return fail([mapSystemError('MISSING_PAYLOAD', 'Mutation returned no payload.', false)]);
  }

  if (payload.errors && payload.errors.length > 0) {
    return fail(payload.errors.map(mapContractError));
  }

  if (payload.data == null) {
    return fail([
      mapSystemError('MALFORMED_RESPONSE', 'Mutation succeeded without returning data.', false),
    ]);
  }

  return ok(payload.data);
};

export async function executeMutation<TPayload, TData, TVariables extends OperationVariables>(
  client: ApolloClient,
  args: ExecuteMutationArgs<TPayload, TVariables>,
  selectPayload: (data: TPayload) => MutationPayload<TData> | null | undefined,
): Promise<AppResult<TData>> {
  try {
    const res = await client.mutate({
      mutation: args.mutation,
      variables: args.variables,
    });

    if (!res.data) {
      return fail([
        mapSystemError('MISSING_RESPONSE_DATA', 'Mutation returned no response data.', false),
      ]);
    }

    return normalizeMutationPayload(selectPayload(res.data));
  } catch (error) {
    return fail([mapUnknownSystemError(error)]);
  }
}
