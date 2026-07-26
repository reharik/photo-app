// Auth client for the unified email → code → password flow.
//
// Both doors (signup, forgot-password) call THIS — never fetch directly — so the two
// network calls, their timing, and their error mapping are identical across doors.
//
// Plain fetch, same conventions as useApiFetch (credentials: 'include' so the server
// can set the httpOnly session cookie on set-password success). Paths in
// authContract.AUTH_ROUTES.

import { config } from '../../config';
import {
  AUTH_ROUTES,
  type EmailVerificationRequest,
  type EmailVerificationResult,
  type SetPasswordErrorReason,
  type SetPasswordRequest,
  type SetPasswordResult,
} from './authContract';

const apiUrl = (path: string): string => {
  const base = config.apiBaseUrl.endsWith('/') ? config.apiBaseUrl.slice(0, -1) : config.apiBaseUrl;
  return `${base}${path}`;
};

const postJson = async (path: string, body: unknown): Promise<Response> =>
  fetch(apiUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const emailVerification = async (
  req: EmailVerificationRequest,
): Promise<EmailVerificationResult> => {
  try {
    const response = await postJson(AUTH_ROUTES.emailVerification, req);
    if (!response.ok) {
      // Existence-blind endpoint: a non-200 is a transport/server fault, never a
      // "no account" signal. Report failure without inferring existence.
      return { ok: false };
    }
    const data = (await response.json()) as { message?: string };
    return { ok: true, message: data.message ?? '' };
  } catch {
    return { ok: false };
  }
};

// Map the server's ContractError wire value (its constantCase `.value`) to the reason the
// UI acts on. Anything not listed collapses to INVALID_CODE, so we never surface more than
// the contract allows. NAME_REQUIRED reveals the name fields in place on the calling screen.
const WIRE_TO_REASON: Record<string, SetPasswordErrorReason> = {
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  MISSING_FIRST_OR_LAST_NAME: 'NAME_REQUIRED',
};

const setPassword = async (req: SetPasswordRequest): Promise<SetPasswordResult> => {
  try {
    const response = await postJson(AUTH_ROUTES.setPassword, req);
    if (response.ok) {
      const data = (await response.json()) as { email?: string };
      return { ok: true, email: data.email ?? req.email };
    }
    // 400 with a code-level reason is the only failure we surface; anything else maps
    // to a generic invalid-code so we never leak more than the contract allows.
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    const reason = WIRE_TO_REASON[data.error ?? ''] ?? 'INVALID_CODE';
    return { ok: false, reason };
  } catch {
    return { ok: false, reason: 'INVALID_CODE' };
  }
};

export const authClient: {
  emailVerification: (req: EmailVerificationRequest) => Promise<EmailVerificationResult>;
  setPassword: (req: SetPasswordRequest) => Promise<SetPasswordResult>;
} = {
  emailVerification,
  setPassword,
};
