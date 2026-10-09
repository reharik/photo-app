import { Capture } from '@packages/worker-core';
import exifr from 'exifr';
import { computeCaptureInstant, nullCapture } from './computeCaptureInstant.js';

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

// Year-first only: 20130814_153022, PXL_20130814_153022123, 2013-08-14 15.30.22,
// "Screenshot 2013-08-14 at 15.30.22". Two-digit forms like 8_14_13 never match.
const FILENAME_DATE =
  /(?<!\d)(\d{4})-?(\d{2})-?(\d{2})(?!\d)(?:[ _T-]+(?:at )?(\d{2})[.:-]?(\d{2})[.:-]?(\d{2}))?/;

const ONE_DAY_MS = 86_400_000;

export const captureFromFilename = (filename: string): Capture => {
  const m = FILENAME_DATE.exec(filename);
  if (!m) return nullCapture();
  const [, y, mo, d, h = '00', mi = '00', s = '00'] = m;

  const capture = computeCaptureInstant(`${y}-${mo}-${d}T${h}:${mi}:${s}`, undefined);
  const at = capture.takenAtUtc;
  if (!at || at.getUTCFullYear() < 1990 || at.getTime() > Date.now() + ONE_DAY_MS) {
    return nullCapture();
  }
  return { ...capture, takenAtSource: 'filename' };
};

export const extractCaptureTime = async (buffer: Buffer): Promise<Capture> => {
  try {
    const exif = (await exifr.parse(buffer, {
      reviveValues: false,
      pick: ['DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal', 'OffsetTimeDigitized'],
    })) as ExifCaptureFields | null | undefined;

    const { dateStr, offsetStr } = pickExifCaptureFields(exif);
    const source = dateStr ? 'exif' : undefined;
    return { ...computeCaptureInstant(dateStr, offsetStr), takenAtSource: source };
  } catch {
    return { takenAtUtc: undefined, takenAtUtcOffsetMinutes: undefined };
  }
};
