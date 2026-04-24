import type { Readable } from 'node:stream';

import type { MediaAssetKind } from '@packages/contracts';

const assetKindToPathSegment = (kind: MediaAssetKind): string => {
  return kind.value.trim().toLowerCase();
};

/**
 * Directory prefix for all assets of one media item (no trailing slash; asset keys append `/{kind}`).
 * Kept in sync with `media_item.storage_key` on persist until that column is dropped.
 */
export const buildMediaItemBaseStorageKey = (ownerId: string, mediaItemId: string): string => {
  return `media/${ownerId}/${mediaItemId}`;
};

/**
 * Object key under the bucket: `{baseStorageKey}/{kindSegment}` (e.g. media/{ownerId}/{id}/original).
 */
export const buildMediaAssetStorageKey = (baseStorageKey: string, kind: MediaAssetKind): string => {
  return `${baseStorageKey}/${assetKindToPathSegment(kind)}`;
};

export interface UploadTargetRequest {
  storageKey: string;
  mimeType?: string;
}

export interface UploadTarget {
  method: 'PUT';
  url: string;
  headers: Array<{ name: string; value: string }>;
}

export interface MediaStorageObjectMetadata {
  size: number;
  mimeType?: string;
}

export interface MediaStorageStreamResult {
  body: Readable;
  mimeType?: string;
}

export interface MediaStorage {
  getUploadTarget(input: UploadTargetRequest): Promise<UploadTarget>;
  writeObject(input: {
    storageKey: string;
    body: Readable | Buffer;
    mimeType?: string;
  }): Promise<void>;
  /** Removes the object if present; implementations must treat a missing key as success (idempotent). */
  deleteObject(storageKey: string): Promise<void>;
  getObjectMetadata(storageKey: string): Promise<MediaStorageObjectMetadata | undefined>;
  verifyExistence(storageKey: string): Promise<boolean>;
  getObjectAccessUrl(input: { storageKey: string; expiresInSeconds?: number }): Promise<string>;
  getObjectStream(storageKey: string): Promise<MediaStorageStreamResult | undefined>;
  getObjectBuffer(storageKey: string, maxBytes: number): Promise<Buffer | undefined>;
}
