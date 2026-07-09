import type { SetPasswordErrorReason } from './authContract';

// Friendly copy for the code-level set-password failures. Shared by BOTH doors so the
// mapping can't drift — identical response → identical message, per the existence-blind
// guardrail. These reasons are code-level (never existence signals), so surfacing them
// is safe. Route the user back to the code step; never dump them out.
const SET_PASSWORD_ERROR_COPY: Record<SetPasswordErrorReason, string> = {
  INVALID_CODE: "That code isn't right.",
  EXPIRED: 'Code expired — resend.',
  TOO_MANY_ATTEMPTS: 'Too many tries — resend a new code.',
};

export const setPasswordErrorMessage = (reason: SetPasswordErrorReason): string =>
  SET_PASSWORD_ERROR_COPY[reason];

// Generic, existence-blind fallback for a transport/server fault on the request-code
// call. Says nothing about whether an account exists.
export const REQUEST_CODE_FAILURE_MESSAGE =
  'Something went wrong sending your code. Please try again.';

// Neutral confirmation shown after the code is sent, identical for every email.
export const CODE_SENT_MESSAGE = 'If we can reach that email, a 6-digit code is on its way.';
