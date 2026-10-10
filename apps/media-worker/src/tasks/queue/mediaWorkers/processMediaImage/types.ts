import { MediaAssetKind } from '@packages/contracts';
import { Capture, MediaProcessingJobRow } from '@packages/worker-core';
import { WorkerTaskOutcome } from '../../../../types';

export type PipelineAsset = {
  sizeBytes: number;
  mimeType: string;
  width: number;
  height: number;
  kind: MediaAssetKind;
};

export type PipelineResult = {
  displayAsset: PipelineAsset;
  thumbnailAsset: PipelineAsset;
  originalAsset: PipelineAsset;
  capture: Capture;
  durationMs?: number;
};

export type PipelineJobWorkflow =
  { status: 'stop'; message: string } | { status: 'continue'; pipelineResult: PipelineResult };

export type MediaJobWorkflow =
  | {
      status: 'stop';
      level: 'debug' | 'info' | 'warn' | 'error';
      message: string;
      outcome: WorkerTaskOutcome;
      applyFailed?: boolean;
    }
  | { status: 'continue'; job: MediaProcessingJobRow };
