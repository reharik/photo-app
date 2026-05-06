/**
 * @typedef {Object} ConversionErrorContext
 * @property {string} stage
 * @property {number | null} [inputSize]
 * @property {string | null} [detectedFormat]
 * @property {Record<string, unknown>} [details]
 */

export class ConversionError extends Error {
  /**
   * @param {string} message
   * @param {ConversionErrorContext} context
   * @param {unknown} [cause]
   */
  constructor(message, context, cause) {
    super(message);
    this.name = 'ConversionError';
    this.context = context;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
