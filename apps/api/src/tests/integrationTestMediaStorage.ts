import { Readable } from 'node:stream';

import type {
  MediaStorage,
  MediaStorageObjectMetadata,
  MediaStorageStreamResult,
  UploadTarget,
} from '@packages/media-core';

type ObjectState = { size: number; mimeType?: string; body?: Buffer };

const streamToBuffer = async (body: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else if (chunk instanceof Uint8Array) {
      chunks.push(Buffer.from(chunk));
    } else {
      throw new Error('Unsupported chunk type in stream');
    }
  }
  return Buffer.concat(chunks);
};

export type IntegrationTestMediaStorage = MediaStorage & {
  readonly objects: Map<string, ObjectState>;
  clear: () => void;
};

/**
 * In-memory MediaStorage for GraphQL integration tests (no S3, no local media root).
 */
export const createIntegrationTestMediaStorage = (): IntegrationTestMediaStorage => {
  const objects = new Map<string, ObjectState>();

  const clear = (): void => {
    objects.clear();
  };

  const getUploadTarget = async (input: {
    storageKey: string;
    mimeType?: string;
  }): Promise<UploadTarget> => {
    return {
      method: 'PUT',
      url: `https://integration-test.invalid/presigned-put?key=${encodeURIComponent(input.storageKey)}`,
      headers: input.mimeType ? [{ name: 'Content-Type', value: input.mimeType }] : [],
    };
  };

  const writeObject = async (input: {
    storageKey: string;
    body: Readable | Buffer;
    mimeType?: string;
  }): Promise<void> => {
    const body = Buffer.isBuffer(input.body) ? input.body : await streamToBuffer(input.body);
    objects.set(input.storageKey, {
      size: body.length,
      mimeType: input.mimeType,
      body,
    });
  };

  const deleteObject = async (storageKey: string): Promise<void> => {
    objects.delete(storageKey);
  };

  const getObjectMetadata = async (
    storageKey: string,
  ): Promise<MediaStorageObjectMetadata | null> => {
    const o = objects.get(storageKey);
    if (!o) {
      return null;
    }
    const size = o.body !== undefined ? o.body.length : o.size;
    return { size, mimeType: o.mimeType };
  };

  const verifyExistence = async (storageKey: string): Promise<boolean> => objects.has(storageKey);

  const getObjectAccessUrl = async (input: {
    storageKey: string;
    expiresInSeconds?: number;
  }): Promise<string> => {
    return `https://integration-test.invalid/object?key=${encodeURIComponent(input.storageKey)}`;
  };

  const getObjectStream = async (storageKey: string): Promise<MediaStorageStreamResult | null> => {
    const object = objects.get(storageKey);
    if (!object?.body) {
      return null;
    }
    return {
      body: Readable.from(object.body),
      mimeType: object.mimeType,
    };
  };

  const getObjectBuffer = async (storageKey: string, maxBytes: number): Promise<Buffer | null> => {
    const object = objects.get(storageKey);
    if (!object?.body) {
      return null;
    }
    return object.body.subarray(0, Math.min(object.body.length, maxBytes));
  };

  return {
    objects,
    clear,
    getUploadTarget,
    writeObject,
    deleteObject,
    getObjectMetadata,
    verifyExistence,
    getObjectAccessUrl,
    getObjectStream,
    getObjectBuffer,
  };
};
