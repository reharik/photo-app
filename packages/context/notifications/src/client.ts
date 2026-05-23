import { Resend } from 'resend';

let resend: Resend | undefined;

/**
 * Lazily constructs the Resend client when `RESEND_API_KEY` is present.
 * Callers that need a hard failure when the key is missing should check env first.
 */
export const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!resend) {
    resend = new Resend(apiKey);
  }
  return resend;
};
