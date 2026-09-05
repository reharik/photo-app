export interface WorkerJobProcessorBase {
  readonly __workerJobProcessorBrand?: true;
}

export type WorkerJobResult = 'processed' | 'idle';
