import { ContractError, FrontendError } from '@packages/contracts';
import {
  AppError,
  ContractErrorPayload,
  ErrorDefinition,
  ErrorInput,
  FrontendErrorInput,
  Source,
} from './errorTypes';

export const mapToAppError = (
  def: ErrorDefinition,
  input: ErrorInput,
  source: Source,
  context?: Record<string, unknown>,
): AppError => {
  return {
    code: def.value,
    message: input.message ?? def.display,
    field: input.field ?? def.field,
    source,
    category: def.category.value,
    retryable: def.retryable ?? false,
    context,
  };
};

/**
 * The code resolves the wording, category and retryability against the local catalog; `context`
 * is carried through untouched for surfaces that can say more with it (see
 * `formatAppErrorMessage`). Nothing in `context` is allowed to override the message — it is
 * data the server attached, not copy it wrote.
 */
export const mapContractError = (input: ContractErrorPayload): AppError => {
  return mapToAppError(
    ContractError.tryFromValue(input.code) ?? ContractError.unknown,
    {},
    'backend',
    input.context ?? undefined,
  );
};

export const mapFrontendError = (input: FrontendErrorInput): AppError => {
  return mapToAppError(FrontendError.fromValue(input.code.value), input, 'frontend');
};

export const mapUnknownSystemError = (error: unknown): AppError => {
  return {
    code: 'UNKNOWN_SYSTEM_ERROR',
    message: error instanceof Error ? error.message : 'Unexpected error',
    source: 'system',
    category: 'SYSTEM',
    retryable: true,
  };
};
export const mapSystemError = (code: string, message: string, retryable = true): AppError => {
  return {
    code,
    message,
    source: 'system',
    category: 'SYSTEM',
    retryable,
  };
};
