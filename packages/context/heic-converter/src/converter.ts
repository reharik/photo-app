import { promises as fsPromises } from 'node:fs';
import { Readable, type Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import exifr from 'exifr';
import heicConvertModule from 'heic-convert';
import jpeg from 'jpeg-js';
import pino, { type Logger } from 'pino';

import { ConversionError } from './errors.js';

const SUPPORTED_BRANDS = new Set(['heic', 'heix', 'mif1', 'msf1']);

const defaultLogger = pino({
  name: 'heic-converter',
  level: process.env.LOG_LEVEL ?? 'info',
});

export type HeicInput = string | Buffer | Readable;

export type ConvertHeicToJpegOptions = {
  quality?: number;
  destination?: string | Writable;
  logger?: Logger;
};

export type ConvertHeicToJpegResult = {
  outputBuffer: Buffer;
  originalSize: number;
  convertedSize: number;
  width: number;
  height: number;
  metadata: Record<string, unknown>;
};

export const isHeic = async (input: HeicInput): Promise<boolean> => {
  const inputBuffer = await readInputToBuffer(input);
  return detectHeicBrand(inputBuffer) !== null;
};

export const convertHeicToJpeg = async (
  input: HeicInput,
  options: ConvertHeicToJpegOptions = {},
): Promise<ConvertHeicToJpegResult> => {
  const logger = options.logger ?? defaultLogger;
  const quality = options.quality ?? 0.9;

  if (typeof quality !== 'number' || Number.isNaN(quality) || quality <= 0 || quality > 1) {
    throw new ConversionError('quality must be a number between 0 (exclusive) and 1 (inclusive)', {
      stage: 'validate_options',
      inputSize: null,
      detectedFormat: null,
      details: { quality },
    });
  }

  let inputBuffer: Buffer;

  try {
    inputBuffer = await readInputToBuffer(input);
  } catch (error) {
    throw new ConversionError(
      'Unable to read input data',
      {
        stage: 'read_input',
        inputSize: null,
        detectedFormat: null,
      },
      error,
    );
  }

  const detectedBrand = detectHeicBrand(inputBuffer);

  if (detectedBrand === null) {
    throw new ConversionError('Input is not a supported HEIC/HEIF file (magic byte check failed)', {
      stage: 'validate_format',
      inputSize: inputBuffer.length,
      detectedFormat: 'unknown',
    });
  }

  let exifMetadata: { Orientation?: number } | null = null;
  let orientation = 1;

  try {
    exifMetadata = (await exifr.parse(inputBuffer, true)) as { Orientation?: number } | null;
    if (typeof exifMetadata?.Orientation === 'number') {
      orientation = exifMetadata.Orientation;
    }
  } catch (error) {
    logger.warn({ err: error }, 'Failed to parse EXIF metadata; continuing with orientation=1');
  }

  let convertedBuffer: Buffer;
  try {
    // heic-convert() returns the primary image by default; we intentionally
    // avoid heicConvert.all() to keep single-image output behavior explicit.
    convertedBuffer = await heicConvertModule({
      buffer: inputBuffer,
      format: 'JPEG',
      quality,
    });
  } catch (error) {
    throw new ConversionError(
      'HEIC conversion failed; input may be malformed',
      {
        stage: 'convert_primary_image',
        inputSize: inputBuffer.length,
        detectedFormat: detectedBrand,
      },
      error,
    );
  }

  let outputBuffer: Buffer;
  let outputDimensions: { width: number; height: number };
  try {
    const oriented = applyExifOrientation(convertedBuffer, orientation);
    outputBuffer = oriented.buffer;
    outputDimensions = {
      width: oriented.width,
      height: oriented.height,
    };
  } catch (error) {
    throw new ConversionError(
      'Failed to apply EXIF orientation to converted JPEG',
      {
        stage: 'apply_orientation',
        inputSize: inputBuffer.length,
        detectedFormat: detectedBrand,
        details: { orientation },
      },
      error,
    );
  }

  if (options.destination !== undefined) {
    try {
      await writeOutput(outputBuffer, options.destination);
    } catch (error) {
      throw new ConversionError(
        'Failed writing converted output',
        {
          stage: 'write_output',
          inputSize: inputBuffer.length,
          detectedFormat: detectedBrand,
        },
        error,
      );
    }
  }

  return {
    outputBuffer,
    originalSize: inputBuffer.length,
    convertedSize: outputBuffer.length,
    width: outputDimensions.width,
    height: outputDimensions.height,
    metadata: {
      detectedBrand,
      orientation,
      inputExifPresent: exifMetadata !== null,
      outputExifStripped: true,
      conversion: {
        format: 'JPEG',
        quality,
        selectedImage: 'primary',
      },
    },
  };
};

const readInputToBuffer = async (input: HeicInput): Promise<Buffer> => {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (typeof input === 'string') {
    return fsPromises.readFile(input);
  }

  if (isReadableStream(input)) {
    const chunks: Buffer[] = [];
    for await (const chunk of input) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new TypeError('input must be a file path string, Buffer, or Readable stream');
};

const detectHeicBrand = (buffer: Buffer): string | null => {
  if (buffer.length < 12) {
    return null;
  }

  const boxType = buffer.subarray(4, 8).toString('ascii');
  if (boxType !== 'ftyp') {
    return null;
  }

  const brand = buffer.subarray(8, 12).toString('ascii');
  return SUPPORTED_BRANDS.has(brand) ? brand : null;
};

const applyExifOrientation = (
  jpegBuffer: Buffer,
  orientation: number,
): { buffer: Buffer; width: number; height: number } => {
  const decoded = jpeg.decode(jpegBuffer, { useTArray: true });
  const transformed = transformRgba(decoded.data, decoded.width, decoded.height, orientation);
  // Re-encoding from raw pixel data strips EXIF and other JPEG metadata segments.
  const encoded = jpeg.encode(
    {
      data: transformed.data,
      width: transformed.width,
      height: transformed.height,
    },
    90,
  );

  return {
    buffer: Buffer.from(encoded.data),
    width: transformed.width,
    height: transformed.height,
  };
};

const transformRgba = (
  source: Uint8Array,
  width: number,
  height: number,
  orientation: number,
): { data: Uint8Array; width: number; height: number } => {
  if (orientation === 1 || orientation < 1 || orientation > 8) {
    return { data: source, width, height };
  }

  const swapDimensions = orientation >= 5 && orientation <= 8;
  const destWidth = swapDimensions ? height : width;
  const destHeight = swapDimensions ? width : height;
  const destination = new Uint8Array(destWidth * destHeight * 4);

  const map = orientationCoordinateMapper(orientation, width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceOffset = (y * width + x) * 4;
      const mapped = map(x, y);
      const destinationOffset = (mapped.y * destWidth + mapped.x) * 4;
      destination[destinationOffset] = source[sourceOffset];
      destination[destinationOffset + 1] = source[sourceOffset + 1];
      destination[destinationOffset + 2] = source[sourceOffset + 2];
      destination[destinationOffset + 3] = source[sourceOffset + 3];
    }
  }

  return { data: destination, width: destWidth, height: destHeight };
};

const orientationCoordinateMapper = (
  orientation: number,
  width: number,
  height: number,
): ((x: number, y: number) => { x: number; y: number }) => {
  switch (orientation) {
    case 2:
      return (x, y) => ({ x: width - 1 - x, y });
    case 3:
      return (x, y) => ({ x: width - 1 - x, y: height - 1 - y });
    case 4:
      return (x, y) => ({ x, y: height - 1 - y });
    case 5:
      return (x, y) => ({ x: y, y: x });
    case 6:
      return (x, y) => ({ x: height - 1 - y, y: x });
    case 7:
      return (x, y) => ({ x: height - 1 - y, y: width - 1 - x });
    case 8:
      return (x, y) => ({ x: y, y: width - 1 - x });
    default:
      return (x, y) => ({ x, y });
  }
};

const writeOutput = async (outputBuffer: Buffer, destination: string | Writable): Promise<void> => {
  if (typeof destination === 'string') {
    await fsPromises.writeFile(destination, outputBuffer);
    return;
  }

  if (!isWritableStream(destination)) {
    throw new TypeError('destination must be a file path string or Writable stream');
  }

  await pipeline(Readable.from(outputBuffer), destination);
};

const isReadableStream = (value: unknown): value is Readable => {
  return (
    value instanceof Readable ||
    (typeof value === 'object' &&
      value !== null &&
      typeof (value as Readable)[Symbol.asyncIterator] === 'function' &&
      typeof (value as Readable).pipe === 'function')
  );
};

const isWritableStream = (value: unknown): value is Writable => {
  return typeof value === 'object' && value !== null && typeof (value as Writable).write === 'function';
};

export const __internal = {
  detectHeicBrand,
  transformRgba,
};
