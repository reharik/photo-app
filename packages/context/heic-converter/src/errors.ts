export type ConversionErrorContext = {
  stage: string;
  inputSize?: number | null;
  detectedFormat?: string | null;
  details?: Record<string, unknown>;
};

export class ConversionError extends Error {
  readonly context: ConversionErrorContext;

  constructor(message: string, context: ConversionErrorContext, cause?: unknown) {
    super(message);
    this.name = 'ConversionError';
    this.context = context;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
