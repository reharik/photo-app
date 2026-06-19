import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';

import type {
  MediaStorage,
  MediaStorageObjectMetadata,
  MediaStorageStreamResult,
  UploadTarget,
  UploadTargetRequest,
} from '../../application/media/MediaStorage';

export interface S3MediaStorageInput {
  bucket: string;
  region: string;
  uploadUrlTtlSeconds?: number;
  downloadUrlTtlSeconds?: number;
}

const toReadable = (body: unknown): Readable | undefined => {
  if (!body) return undefined;

  if (body instanceof Readable) {
    return body;
  }

  return undefined;
};

const readableToBuffer = async (body: Readable): Promise<Buffer> => {
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

const isS3ServiceException = (error: unknown): error is S3ServiceException => {
  return error instanceof S3ServiceException;
};

const isMissingObjectError = (error: unknown): boolean => {
  if (!isS3ServiceException(error)) {
    return false;
  }

  return (
    error.name === 'NoSuchKey' ||
    error.name === 'NotFound' ||
    error.$metadata.httpStatusCode === 404
  );
};

const isMissingOrInvisibleHeadError = (error: unknown): boolean => {
  if (!isS3ServiceException(error)) {
    return false;
  }

  return isMissingObjectError(error) || error.$metadata.httpStatusCode === 403;
};

/** Browser-cache directive for write-once derivative objects (display/thumbnail). */
const DERIVATIVE_OBJECT_CACHE_CONTROL = 'private, max-age=31536000, immutable';

const isDerivativeObjectKey = (storageKey: string): boolean => {
  return storageKey.endsWith('/display') || storageKey.endsWith('/thumbnail');
};

export type MediaStorageConfig = {
  s3Bucket: string;
  awsRegion: string;
  s3UploadUrlTtlSeconds: number;
  s3DownloadUrlTtlSeconds: number;
  s3DownloadUrlSigningBucketSeconds: number;
};

export type MediaStorageDeps = {
  config: MediaStorageConfig;
};
export const build__MediaStorage = ({ config }: MediaStorageDeps): MediaStorage => {
  const {
    s3Bucket,
    awsRegion,
    s3UploadUrlTtlSeconds = 900,
    s3DownloadUrlTtlSeconds = 900,
    s3DownloadUrlSigningBucketSeconds = 300,
  } = config;
  const client = new S3Client({ region: awsRegion, requestChecksumCalculation: 'WHEN_REQUIRED' });

  const getUploadTarget = async (input: UploadTargetRequest): Promise<UploadTarget> => {
    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: input.storageKey,
      ContentType: input.mimeType,
    });

    const url = await getSignedUrl(client, command, {
      expiresIn: s3UploadUrlTtlSeconds,
    });

    return {
      method: 'PUT',
      url,
      headers: input.mimeType ? [{ name: 'Content-Type', value: input.mimeType }] : [],
    };
  };

  const writeObject = async (input: {
    storageKey: string;
    body: Readable | Buffer;
    mimeType?: string;
  }): Promise<void> => {
    const commandInput: PutObjectCommandInput = {
      Bucket: s3Bucket,
      Key: input.storageKey,
      Body: input.body,
    };
    if (input.mimeType !== undefined) {
      commandInput.ContentType = input.mimeType;
    }
    if (isDerivativeObjectKey(input.storageKey)) {
      commandInput.CacheControl = DERIVATIVE_OBJECT_CACHE_CONTROL;
    }
    if (Buffer.isBuffer(input.body)) {
      commandInput.ContentLength = input.body.length;
    }
    await client.send(new PutObjectCommand(commandInput));
  };

  const deleteObject = async (storageKey: string): Promise<void> => {
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: s3Bucket,
          Key: storageKey,
        }),
      );
    } catch (error) {
      if (isMissingObjectError(error)) {
        return;
      }
      throw error;
    }
  };

  const getObjectMetadata = async (
    storageKey: string,
  ): Promise<MediaStorageObjectMetadata | undefined> => {
    try {
      const result = await client.send(
        new HeadObjectCommand({
          Bucket: s3Bucket,
          Key: storageKey,
        }),
      );

      if (result.ContentLength == undefined) {
        return undefined;
      }

      return {
        size: result.ContentLength,
        mimeType: result.ContentType,
      };
    } catch (error) {
      if (isMissingOrInvisibleHeadError(error)) {
        return undefined;
      }

      throw error;
    }
  };

  const verifyExistence = async (storageKey: string): Promise<boolean> => {
    const metadata = await getObjectMetadata(storageKey);
    return metadata != undefined;
  };

  const getObjectAccessUrl = async (input: {
    storageKey: string;
    expiresInSeconds?: number;
  }): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: input.storageKey,
    });

    const expiresIn = input.expiresInSeconds ?? s3DownloadUrlTtlSeconds;
    const bucketMs = s3DownloadUrlSigningBucketSeconds * 1000;
    const bucketStartMs = Math.floor(Date.now() / bucketMs) * bucketMs;

    // Presign URL stability invariant: signing bucket MUST stay < download TTL.
    // TTL − bucket is the guaranteed minimum URL validity for a request at the
    // end of a bucket (e.g. 900s TTL − 300s bucket = 600s minimum). Widening
    // one requires widening the other.
    return getSignedUrl(client, command, {
      expiresIn,
      signingDate: new Date(bucketStartMs),
    });
  };

  const getObjectStream = async (
    storageKey: string,
  ): Promise<MediaStorageStreamResult | undefined> => {
    try {
      const result = await client.send(
        new GetObjectCommand({
          Bucket: s3Bucket,
          Key: storageKey,
        }),
      );

      const body = toReadable(result.Body);
      if (!body) {
        return undefined;
      }

      return {
        body,
        mimeType: result.ContentType,
      };
    } catch (error) {
      if (isMissingObjectError(error)) {
        return undefined;
      }

      throw error;
    }
  };

  const getObjectBuffer = async (
    storageKey: string,
    maxBytes: number,
  ): Promise<Buffer | undefined> => {
    if (maxBytes <= 0) {
      return Buffer.alloc(0);
    }

    try {
      const result = await client.send(
        new GetObjectCommand({
          Bucket: s3Bucket,
          Key: storageKey,
          Range: `bytes=0-${maxBytes - 1}`,
        }),
      );

      const body = toReadable(result.Body);
      if (!body) {
        return undefined;
      }

      return readableToBuffer(body);
    } catch (error) {
      if (isMissingObjectError(error)) {
        return undefined;
      }

      throw error;
    }
  };

  return {
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
