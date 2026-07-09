// Swappable auth client for the unified email → code → password flow.
//
// Both doors (signup, forgot-password) call THIS — never fetch directly — so the two
// network calls, their timing, and their error mapping are identical across doors.
// Flip USE_MOCK to false (or later gate on an env var) to hit the real REST endpoints
// with zero call-site change.

import { config } from '../../config';
import {
  AUTH_ROUTES,
  type EmailVerificationRequest,
  type EmailVerificationResult,
  type SetPasswordErrorReason,
  type SetPasswordRequest,
  type SetPasswordResult,
} from './authContract';

// The backend endpoints are freshly written and may not be wired/compiling yet, so the
// whole frontend is built against the mock. Set to false once the backend is confirmed
// live (paths in authContract.AUTH_ROUTES).
const USE_MOCK = true;

// ---------------------------------------------------------------------------
// Real client — plain fetch, same conventions as useApiFetch (credentials: 'include'
// so the server can set the httpOnly session cookie on set-password success).
// ---------------------------------------------------------------------------
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

const realEmailVerification = async (
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

const KNOWN_REASONS: readonly SetPasswordErrorReason[] = [
  'INVALID_CODE',
  'EXPIRED',
  'TOO_MANY_ATTEMPTS',
];

const realSetPassword = async (req: SetPasswordRequest): Promise<SetPasswordResult> => {
  try {
    const response = await postJson(AUTH_ROUTES.setPassword, req);
    if (response.ok) {
      const data = (await response.json()) as { email?: string };
      return { ok: true, email: data.email ?? req.email };
    }
    // 400 with a code-level reason is the only failure we surface; anything else maps
    // to a generic invalid-code so we never leak more than the contract allows.
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    const reason = KNOWN_REASONS.find((r) => r === data.error) ?? 'INVALID_CODE';
    return { ok: false, reason };
  } catch {
    return { ok: false, reason: 'INVALID_CODE' };
  }
};

// ---------------------------------------------------------------------------
// Mock client — lets the whole UI (including EXPIRED / TOO_MANY_ATTEMPTS states) be
// built and demoed before the backend is live.
//   email-verification: always succeeds (existence-blind).
//   set-password magic codes:
//     '123456' → success (logged in)
//     '000000' → EXPIRED
//     '111111' → TOO_MANY_ATTEMPTS
//     anything else → INVALID_CODE
// ---------------------------------------------------------------------------
const MOCK_LATENCY_MS = 400;
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const mockEmailVerification = async (): Promise<EmailVerificationResult> => {
  await delay(MOCK_LATENCY_MS);
  return { ok: true, message: 'If an account matches, a code is on its way.' };
};

const mockSetPassword = async (req: SetPasswordRequest): Promise<SetPasswordResult> => {
  await delay(MOCK_LATENCY_MS);
  switch (req.code) {
    case '123456':
      return { ok: true, email: req.email };
    case '000000':
      return { ok: false, reason: 'EXPIRED' };
    case '111111':
      return { ok: false, reason: 'TOO_MANY_ATTEMPTS' };
    default:
      return { ok: false, reason: 'INVALID_CODE' };
  }
};

export const authClient: {
  emailVerification: (req: EmailVerificationRequest) => Promise<EmailVerificationResult>;
  setPassword: (req: SetPasswordRequest) => Promise<SetPasswordResult>;
} = {
  emailVerification: USE_MOCK ? mockEmailVerification : realEmailVerification,
  setPassword: USE_MOCK ? mockSetPassword : realSetPassword,
};
