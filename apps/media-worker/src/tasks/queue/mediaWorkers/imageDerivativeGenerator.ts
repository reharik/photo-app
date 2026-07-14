import type { Logger } from '@packages/infrastructure';
import sharp from 'sharp';

const DISPLAY_MAX_EDGE = 1600;
const THUMBNAIL_MAX_EDGE = 480;
const DERIVATIVE_MIME = 'image/jpeg';
const JPEG_QUALITY = 85;

export type GeneratedDerivative = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
};

export type ImageDerivatives = {
  display: GeneratedDerivative;
  thumbnail: GeneratedDerivative;
  replacementOriginal?: GeneratedDerivative;
};

type HeicConverterModule = {
  isHeic: (input: Buffer) => Promise<boolean>;
  convertHeicToJpeg: (
    input: Buffer,
    options?: { quality?: number },
  ) => Promise<{
    outputBuffer: Buffer;
    convertedSize: number;
    width: number;
    height: number;
  }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isHeicConverterModule = (value: unknown): value is HeicConverterModule => {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.isHeic === 'function' && typeof value.convertHeicToJpeg === 'function';
};

const loadHeicConverterModule = async (): Promise<HeicConverterModule> => {
  const importedModule: unknown = await import('@packages/heic-converter');
  if (!isHeicConverterModule(importedModule)) {
    throw new Error('@packages/heic-converter does not expose expected API');
  }

  return importedModule;
};

const resizeToDerivative = async (
  originalBuffer: Buffer,
  maxEdge: number,
): Promise<GeneratedDerivative> => {
  const { data, info } = await sharp(originalBuffer)
    .rotate()
    .resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  if (info.width == null || info.height == null) {
    throw new Error('Derivative dimensions missing after resize');
  }

  return {
    buffer: data,
    mimeType: DERIVATIVE_MIME,
    width: info.width,
    height: info.height,
    fileSizeBytes: data.length,
  };
};

// Each derivative step can throw (HEIC decode, sharp resize, OOM on a huge image). Without a
// stage label the job runner's top-level catch just says "processing failed" with no clue which
// step broke. Wrap each step so a failure is logged and rethrown with the stage in its message.
const runStage = async <T>(stage: string, fn: () => Promise<T>, logger?: Logger): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (e instanceof Error) {
      logger?.error(`Image derivative stage "${stage}" failed`, e, { stage });
    } else {
      logger?.error(`Image derivative stage "${stage}" failed`, { stage, err: message });
    }
    throw new Error(`image derivative stage "${stage}" failed: ${message}`);
  }
};

export const generateImageDerivatives = async (
  originalBuffer: Buffer,
  logger?: Logger,
): Promise<ImageDerivatives> => {
  let workingBuffer = originalBuffer;
  let replacementOriginal: GeneratedDerivative | undefined;

  const heicConverter = await runStage('load_heic_module', () => loadHeicConverterModule(), logger);
  const isHeic = await runStage('detect_heic', () => heicConverter.isHeic(originalBuffer), logger);
  if (isHeic) {
    const result = await runStage(
      'heic_convert',
      () => heicConverter.convertHeicToJpeg(originalBuffer, { quality: 0.95 }),
      logger,
    );
    workingBuffer = result.outputBuffer;
    replacementOriginal = {
      buffer: result.outputBuffer,
      mimeType: DERIVATIVE_MIME,
      width: result.width,
      height: result.height,
      fileSizeBytes: result.convertedSize,
    };
  }

  const display = await runStage(
    'resize_display',
    () => resizeToDerivative(workingBuffer, DISPLAY_MAX_EDGE),
    logger,
  );
  const thumbnail = await runStage(
    'resize_thumbnail',
    () => resizeToDerivative(workingBuffer, THUMBNAIL_MAX_EDGE),
    logger,
  );
  return { display, thumbnail, replacementOriginal };
};
