import type { OperationVariables } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { useCallback, useRef, useState } from 'react';
import { mapSystemError } from '../../../application/errors/mapToError';
import {
  type AppError,
  type AppResult,
  type ExecuteMutationArgs,
  fail,
  type MutationPayload,
} from '../../../application/errors/types';
import { executeMutation } from '../../../application/graphql/executeMutation';

type UseAppMutationStateResult = {
  isLoading: boolean;
  errors: AppError[];
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

  const execute = useCallback(
    async <TPayload, TData, TVariables extends OperationVariables>(
      args: ExecuteMutationArgs<TPayload, TVariables>,
      selectPayload: (data: TPayload) => MutationPayload<TData> | null | undefined,
    ): Promise<AppResult<TData>> => {
      if (inFlightRef.current) {
        const nextErrors = [
          mapSystemError(
            'MUTATION_ALREADY_IN_PROGRESS',
            'Please wait for the current action to finish.',
            false,
          ),
        ];

        setErrors(nextErrors);
        return fail(nextErrors);
      }

      inFlightRef.current = true;
      setIsLoading(true);
      setErrors([]);

      try {
        const result = await executeMutation(client, args, selectPayload);

        if (!result.success) {
          setErrors(result.errors);
        }

        return result;
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
    execute,
  };
};
