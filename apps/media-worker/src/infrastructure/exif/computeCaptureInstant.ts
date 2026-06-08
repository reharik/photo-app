export type CaptureInstant = {
  takenAtUtc?: Date;
  takenAtUtcOffsetMinutes?: number;
};

const EXIF_DATE_REGEX = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
const EXIF_OFFSET_REGEX = /^([+-])(\d{2}):(\d{2})$/;

const nullCaptureInstant = (): CaptureInstant => ({
  takenAtUtc: undefined,
  takenAtUtcOffsetMinutes: undefined,
});

export const computeCaptureInstant = (
  dateStr: string | undefined,
  offsetStr: string | undefined,
): CaptureInstant => {
  if (dateStr === undefined) {
    return nullCaptureInstant();
  }

  const dateMatch = EXIF_DATE_REGEX.exec(dateStr);
  if (!dateMatch) {
    return nullCaptureInstant();
  }

  const [, year, month, day, hour, minute, second] = dateMatch;
  const isoLocal = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

  let takenAtUtcOffsetMinutes: number | undefined = undefined;
  let iso: string;

  if (offsetStr !== undefined) {
    const offsetMatch = EXIF_OFFSET_REGEX.exec(offsetStr);
    if (offsetMatch) {
      const sign = offsetMatch[1] === '+' ? 1 : -1;
      const offsetHours = Number.parseInt(offsetMatch[2], 10);
      const offsetMinutesPart = Number.parseInt(offsetMatch[3], 10);
      takenAtUtcOffsetMinutes = sign * (offsetHours * 60 + offsetMinutesPart);
      iso = `${isoLocal}${offsetStr}`;
    } else {
      iso = `${isoLocal}Z`;
    }
  } else {
    iso = `${isoLocal}Z`;
  }

  const takenAtUtc = new Date(iso);
  if (Number.isNaN(takenAtUtc.getTime())) {
    return nullCaptureInstant();
  }

  return { takenAtUtc, takenAtUtcOffsetMinutes };
};
