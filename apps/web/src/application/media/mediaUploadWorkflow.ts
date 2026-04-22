import type { ApolloClient } from '@apollo/client';

import { FrontendError, FrontendUploadStatus as FUS } from '@packages/contracts';
import {
  CreateMediaUploadDocument,
  FinalizeMediaUploadDocument,
  type CreateMediaUploadMutationVariables,
} from '../../graphql/generated/types';
import { AppResultFailure, fail, ok, type AppResult } from '../errors/types';
import { executeMutation } from '../graphql/executeMutation';
import { UploadWorkflowEvent } from './types';

const resolveMediaKind = (
  file: File,
): CreateMediaUploadMutationVariables['input']['kind'] | undefined => {
  if (file.type.startsWith('image/')) return 'PHOTO';
  if (file.type.startsWith('video/')) return 'VIDEO';
  return undefined;
};

const buildUploadBody = (file: File, method: string): BodyInit => {
  if (method.toUpperCase() === 'PUT') return file;

  const formData = new FormData();
  formData.append('file', file);
  return formData;
};

const createMediaUpload = async (
  client: ApolloClient,
  file: File,
): Promise<
  AppResult<{
    mediaItemId: string;
    uploadInstructions: {
      url: string;
      method: string;
      headers: Array<{ key: string; value: string }>;
    };
  }>
> => {
  const kind = resolveMediaKind(file);
  if (!kind) {
    // TODO: add these to FrontendErrorEnum
    return fail([FrontendError.unsupportedMediaType]);
  }

  const mimeType = file.type || 'application/octet-stream';

  const result = await executeMutation(
    client,
    {
      mutation: CreateMediaUploadDocument,
      variables: {
        input: {
          kind,
          mimeType,
          originalFileName: file.name.trim() !== '' ? file.name : undefined,
        },
      },
    },
    (data) => data.createMediaUpload,
  );

  if (!result.success) {
    return result;
  }

  const payload = result.data;
  if (!payload?.mediaItemId || !payload.uploadInstructions?.url) {
    return fail([FrontendError.invalidCreateMediaUploadPayload]);
  }

  return ok({
    mediaItemId: payload.mediaItemId,
    uploadInstructions: payload.uploadInstructions,
  });
};

const uploadBinary = async (
  file: File,
  uploadInstructions: {
    url: string;
    method: string;
    headers: Array<{ key: string; value: string }>;
  },
): Promise<AppResult<void>> => {
  const token = localStorage.getItem('authToken');
  const uploadUrl = new URL(uploadInstructions.url, window.location.origin);
  const sameOrigin = uploadUrl.origin === window.location.origin;

  const headers: Record<string, string> = {
    ...(sameOrigin && token ? { Authorization: `Bearer ${token}` } : {}),
  };

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

export const mediaUploadWorkflow = async (
  client: ApolloClient,
  file: File,
  onEvent: (event: UploadWorkflowEvent) => void,
): Promise<AppResult<{ mediaItemId: string }>> => {
  try {
    onEvent({ type: FUS.creating });
    const created = await createMediaUpload(client, file);
    if (!created.success) {
      onEvent({
        type: FUS.failed,
        stage: FUS.creating,
        errors: created.errors,
      });
      return created;
    }

    const mediaItemId = created.data.mediaItemId;
    onEvent({ type: FUS.uploading, mediaItemId });
    const uploaded = await uploadBinary(file, created.data.uploadInstructions);

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

    onEvent?.({
      type: FUS.failed,
      stage: FUS.uploading,
      errors: (result as AppResultFailure).errors,
    });

    return result;
  }
};
