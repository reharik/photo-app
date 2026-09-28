import { MediaStorageStreamResult } from '@packages/worker-core';
import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import { computeCaptureInstant } from '../../../infrastructure/exif/computeCaptureInstant';
import { Capture } from './processMediaImage/types';

export type GeneratedVideoDerivative = {
  path: string;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
};

export type VideoDerivatives = {
  original: GeneratedVideoDerivative;
  display: GeneratedVideoDerivative;
  thumbnail: GeneratedVideoDerivative;
  capture: Capture;
  durationMs: number;
};

type ProbeStream = {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
  tags?: { rotate?: string };
  side_data_list?: Array<{ rotation?: number }>;
};

type Probe = {
  streams: ProbeStream[];
  format: {
    duration?: string; // seconds, as a string
    tags?: { creation_time?: string; 'com.apple.quicktime.creationdate'?: string };
  };
};

type VideoMetadata = {
  durationMs: number;
  height?: number;
  width?: number;
  capture: Capture;
};

const exec = promisify(execFile);
const execOpts = { timeout: 900_000, maxBuffer: 10 * 1024 * 1024 };

const generateMetadata = async (originalPath: string): Promise<VideoMetadata> => {
  const { stdout } = await exec('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    originalPath,
  ]);
  const probe = JSON.parse(stdout) as Probe;
  const videoStream = probe.streams.find((s) => s.codec_type === 'video');
  if (!videoStream) throw new Error('no video stream');

  const durationMs = Math.round(Number(probe.format.duration) * 1000);

  // rotation: newer ffprobe puts it in side_data_list, older in tags.rotate
  const rotation = Number(
    videoStream.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ??
      videoStream.tags?.rotate ??
      0,
  );
  const swapped = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;
  const width = swapped ? videoStream.height : videoStream.width;
  const height = swapped ? videoStream.width : videoStream.height;
  const created = probe.format.tags?.creation_time;
  const takenAtUtcOffsetMinutes = probe.format.tags?.['com.apple.quicktime.creationdate'];
  const capture = computeCaptureInstant(created, takenAtUtcOffsetMinutes);
  return {
    durationMs,
    height,
    width,
    capture,
  };
};

const probeDimensions = async (path: string): Promise<{ width: number; height: number }> => {
  const { stdout } = await exec(
    'ffprobe',
    ['-v', 'error', '-print_format', 'json', '-show_streams', path],
    execOpts,
  );
  const probe = JSON.parse(stdout) as Probe;
  const stream = probe.streams.find((s) => s.codec_type === 'video');
  return { width: stream?.width ?? 0, height: stream?.height ?? 0 };
};

const transformVideo = async (
  originalPath: string,
  displayPath: string,
): Promise<GeneratedVideoDerivative> => {
  await exec(
    'ffmpeg',
    [
      '-loglevel',
      'error',
      '-i',
      originalPath,
      '-vf',
      "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps='min(30,source_fps)'",
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      '-map_metadata',
      '-1',
      '-threads',
      '0',
      '-y',
      displayPath,
    ],
    execOpts,
  );

  const { width, height } = await probeDimensions(displayPath);

  const display: GeneratedVideoDerivative = {
    path: displayPath,
    mimeType: 'video/mp4',
    width,
    height,
    fileSizeBytes: (await stat(displayPath)).size,
  };
  return display;
};

const generateThumbnail = async (
  dir: string,
  sourcePath: string,
  durationMs: number,
): Promise<GeneratedVideoDerivative> => {
  const thumbnailPath = join(dir, 'poster.jpg');

  await exec(
    'ffmpeg',
    [
      '-loglevel',
      'error',
      '-ss',
      durationMs < 1000 ? '0' : '1',
      '-i',
      sourcePath,
      '-frames:v',
      '1',
      '-vf',
      "scale='min(640,iw)':-2",
      '-q:v',
      '3',
      '-y',
      thumbnailPath,
    ],
    execOpts,
  );

  const { width, height } = await probeDimensions(thumbnailPath);

  const thumbnail: GeneratedVideoDerivative = {
    path: thumbnailPath,
    mimeType: 'image/jpeg',
    width,
    height,
    fileSizeBytes: (await stat(thumbnailPath)).size,
  };
  return thumbnail;
};

export const generateVideoDerivatives = async (
  streamResult: MediaStorageStreamResult,
  dir: string,
): Promise<VideoDerivatives> => {
  const originalPath = join(dir, 'original');
  await pipeline(streamResult.body, createWriteStream(originalPath));

  const metadata = await generateMetadata(originalPath);
  const original: GeneratedVideoDerivative = {
    path: originalPath,
    mimeType: streamResult.mimeType || '',
    width: metadata.width || 0,
    height: metadata.height || 0,
    fileSizeBytes: (await stat(originalPath)).size,
  };

  const displayPath = join(dir, 'display.mp4');
  const display = await transformVideo(originalPath, displayPath);
  const thumbnail = await generateThumbnail(dir, displayPath, metadata.durationMs);

  return {
    display,
    thumbnail,
    original,
    durationMs: metadata.durationMs,
    capture: metadata.capture,
  };
};
