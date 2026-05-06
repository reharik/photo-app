import type { Readable, Writable } from 'node:stream';

export type HeicInput = string | Buffer | Readable;

export type ConvertHeicToJpegOptions = {
  quality?: number;
  destination?: string | Writable;
  logger?: {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug?: (...args: unknown[]) => void;
  };
};

export type ConvertHeicToJpegResult = {
  outputBuffer: Buffer;
  originalSize: number;
  convertedSize: number;
  width: number;
  height: number;
  metadata: Record<string, unknown>;
};

export declare class ConversionError extends Error {
  context: {
    stage: string;
    inputSize?: number | null;
    detectedFormat?: string | null;
    details?: Record<string, unknown>;
  };
  cause?: unknown;
}

export declare const isHeic: (input: HeicInput) => Promise<boolean>;
export declare const convertHeicToJpeg: (
  input: HeicInput,
  options?: ConvertHeicToJpegOptions,
) => Promise<ConvertHeicToJpegResult>;
