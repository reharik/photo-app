import type { OperationVariables } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { useCallback, useRef, useState } from 'react';
import { mapSystemError, mapUnknownSystemError } from '../../../application/errors/mapToError';
import {
  AppError,
  AppResult,
  ExecuteMutationArgs,
  fail,
  MutationPayload,
} from '../../../application/errors/types';
import { normalizeMutationPayload } from '../../../application/graphql/executeMutation';

type UseAppMutationStateResult = {
  isLoading: boolean;
  errors: AppError[];
  clearErrors: () => void;
  execute: <TPayload, TData, TVariables extends OperationVariables>(
    args: ExecuteMutationArgs<TPayload, TVariables>,
    selectPayload: (data: TPayload) => MutationPayload<TData> | null | undefined,
  ) => Promise<AppResult<TData>>;
};

export const useAppMutationState = (): UseAppMutationStateResult => {
  const client = useApolloClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<AppError[]>([]);
  const inFlightRef = useRef(false);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const execute = useCallback(
    async <TPayload, TData, TVariables extends OperationVariables>(
      args: ExecuteMutationArgs<TPayload, TVariables>,
      selectPayload: (data: TPayload) => MutationPayload<TData> | null | undefined,
    ): Promise<AppResult<TData>> => {
      if (inFlightRef.current) {
        const errors = [
          mapSystemError(
            'MUTATION_ALREADY_IN_PROGRESS',
            'Please wait for the current action to finish.',
            false,
          ),
        ];

        setErrors(errors);
        return fail(errors);
      }

      inFlightRef.current = true;
      setIsLoading(true);
      setErrors([]);

      try {
        const res = await client.mutate<TPayload, TVariables>({
          mutation: args.mutation,
          variables: args.variables,
        });

        if (!res.data) {
          const errors = [
            mapSystemError('MISSING_RESPONSE_DATA', 'Mutation returned no response data.', false),
          ];
          setErrors(errors);
          return fail(errors);
        }

        const result = normalizeMutationPayload(selectPayload(res.data));

        if (!result.success) {
          setErrors(result.errors);
        }

        return result;
      } catch (error) {
        const errors = [mapUnknownSystemError(error)];
        setErrors(errors);
        return fail(errors);
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [client],
  );

  return {
    isLoading,
    errors,
    clearErrors,
    execute,
  };
};
