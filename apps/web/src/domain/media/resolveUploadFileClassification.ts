/**
 * Maps selected files to GraphQL upload input. Browsers often leave `File.type`
 * empty for HEIC/HEIF or send `application/octet-stream`; we fall back on the extension.
 */

import { MediaKind } from '@packages/contracts';

export type ResolvedUploadClassification = {
  kind: typeof MediaKind.photo | typeof MediaKind.video;
  mimeType: string;
};

const TYPE_OCTET_STREAM = 'application/octet-stream';

const getExtensionLower = (fileName: string): string => {
  const trimmed = fileName.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot < 0 || dot === trimmed.length - 1) {
    return '';
  }
  return trimmed.slice(dot).toLowerCase();
};

const mimeIsGenericOrMissing = (type: string): boolean =>
  type === '' || type === TYPE_OCTET_STREAM;

/** Extension (lowercase, includes dot) → photo MIME for createMediaUpload. */
const PHOTO_EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

/** Extension → video MIME. */
const VIDEO_EXT_TO_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
};

export const resolveUploadFileClassification = (file: File): ResolvedUploadClassification | undefined => {
  const rawType = file.type.trim();

  if (rawType.startsWith('image/')) {
    return { kind: MediaKind.photo, mimeType: rawType };
  }
  if (rawType.startsWith('video/')) {
    return { kind: MediaKind.video, mimeType: rawType };
  }

  const ext = getExtensionLower(file.name);
  const photoMime = PHOTO_EXT_TO_MIME[ext];
  if (photoMime) {
    return {
      kind: MediaKind.photo,
      mimeType: mimeIsGenericOrMissing(rawType) ? photoMime : rawType,
    };
  }

  const videoMime = VIDEO_EXT_TO_MIME[ext];
  if (videoMime) {
    return {
      kind: MediaKind.video,
      mimeType: mimeIsGenericOrMissing(rawType) ? videoMime : rawType,
    };
  }

  return undefined;
};
