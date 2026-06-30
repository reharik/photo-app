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

export const generateImageDerivatives = async (
  originalBuffer: Buffer,
): Promise<ImageDerivatives> => {
  let workingBuffer = originalBuffer;
  let replacementOriginal: GeneratedDerivative | undefined;

  const heicConverter = await loadHeicConverterModule();
  if (await heicConverter.isHeic(originalBuffer)) {
    const result = await heicConverter.convertHeicToJpeg(originalBuffer, { quality: 0.95 });
    workingBuffer = result.outputBuffer;
    replacementOriginal = {
      buffer: result.outputBuffer,
      mimeType: DERIVATIVE_MIME,
      width: result.width,
      height: result.height,
      fileSizeBytes: result.convertedSize,
    };
  }

  const display = await resizeToDerivative(workingBuffer, DISPLAY_MAX_EDGE);
  const thumbnail = await resizeToDerivative(workingBuffer, THUMBNAIL_MAX_EDGE);
  return { display, thumbnail, replacementOriginal };
};
