import exifr from 'exifr';

import { computeCaptureInstant, type CaptureInstant } from './computeCaptureInstant.js';

type ExifCaptureFields = {
  DateTimeOriginal?: string;
  CreateDate?: string;
  OffsetTimeOriginal?: string;
  OffsetTimeDigitized?: string;
};

const pickExifCaptureFields = (
  exif: ExifCaptureFields | null | undefined,
): { dateStr: string | undefined; offsetStr: string | undefined } => {
  if (exif?.DateTimeOriginal !== undefined) {
    return {
      dateStr: exif.DateTimeOriginal,
      offsetStr: exif.OffsetTimeOriginal,
    };
  }

  if (exif?.CreateDate !== undefined) {
    return {
      dateStr: exif.CreateDate,
      offsetStr: exif.OffsetTimeDigitized,
    };
  }

  return { dateStr: undefined, offsetStr: undefined };
};

export const extractCaptureTime = async (buffer: Buffer): Promise<CaptureInstant> => {
  try {
    const exif = (await exifr.parse(buffer, {
      reviveValues: false,
      pick: ['DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal', 'OffsetTimeDigitized'],
    })) as ExifCaptureFields | null | undefined;

    const { dateStr, offsetStr } = pickExifCaptureFields(exif);
    return computeCaptureInstant(dateStr, offsetStr);
  } catch {
    return { takenAtUtc: undefined, takenAtUtcOffsetMinutes: undefined };
  }
};
