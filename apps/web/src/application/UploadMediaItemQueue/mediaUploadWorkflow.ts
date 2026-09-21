import type { ApolloClient } from '@apollo/client';

import { FrontendError, FrontendUploadStatus as FUS } from '@packages/contracts';
import { AppResultFailure, fail, ok, type AppResult } from '../../domain/errors/errorTypes';
import { executeMutation } from '../../domain/graphql/executeMutation';
import { FinalizeMediaUploadDocument } from '../../graphql/generated/types';
import type { UploadInstructions, UploadWorkflowEvent } from './mediaUploadTypes';

const buildUploadBody = (file: File, method: string): BodyInit => {
  if (method.toUpperCase() === 'PUT') return file;

  const formData = new FormData();
  formData.append('file', file);
  return formData;
};

const uploadBinary = async (
  file: File,
  uploadInstructions: UploadInstructions,
): Promise<AppResult<void>> => {
  const headers: Record<string, string> = {};

  for (const h of uploadInstructions.headers) {
    headers[h.key] = h.value;
  }

  const response = await fetch(uploadInstructions.url, {
    method: uploadInstructions.method,
    headers,
    body: buildUploadBody(file, uploadInstructions.method),
  });

  if (!response.ok) {
    return fail([FrontendError.uploadFailed]);
  }

  return ok(undefined);
};

const finalizeMediaUpload = async (
  client: ApolloClient,
  mediaItemId: string,
): Promise<AppResult<{ mediaItemId: string }>> => {
  const result = await executeMutation(
    client,
    {
      mutation: FinalizeMediaUploadDocument,
      variables: { input: { mediaItemId } },
    },
    (data) => data.finalizeMediaUpload,
  );

  if (!result.success) {
    return result;
  }

  const payload = result.data;
  if (!payload?.mediaItemId) {
    return fail([FrontendError.finalizeFailed]);
  }

  return ok({ mediaItemId: payload.mediaItemId });
};

/**
 * PUT + finalize for one item already holding presigned upload instructions
 * (see `presignUploadBatch`).
 */
export const uploadAndFinalize = async (
  client: ApolloClient,
  file: File,
  mediaItemId: string,
  uploadInstructions: UploadInstructions,
  onEvent: (event: UploadWorkflowEvent) => void,
): Promise<AppResult<{ mediaItemId: string }>> => {
  try {
    onEvent({ type: FUS.uploading, mediaItemId });
    const uploaded = await uploadBinary(file, uploadInstructions);
    if (!uploaded.success) {
      onEvent({
        type: FUS.failed,
        mediaItemId,
        stage: FUS.uploading,
        errors: uploaded.errors,
      });
      return uploaded;
    }

    onEvent({ type: FUS.finalizing, mediaItemId });
    const finalized = await finalizeMediaUpload(client, mediaItemId);
    if (!finalized.success) {
      onEvent({
        type: FUS.failed,
        mediaItemId,
        stage: FUS.finalizing,
        errors: finalized.errors,
      });
      return finalized;
    }
    onEvent({ type: FUS.complete, mediaItemId });
    return ok({ mediaItemId });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    const result = fail([FrontendError.networkError]);

    onEvent({
      type: FUS.failed,
      mediaItemId,
      stage: FUS.uploading,
      errors: (result as AppResultFailure).errors,
    });

    return result;
  }
};
