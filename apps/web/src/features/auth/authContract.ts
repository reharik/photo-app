// Hand-authored REST contract for the unified auth flow (email → code → password).
//
// Auth is REST (Koa `/auth/*`), NOT GraphQL — there is no SDL/codegen for it. These
// types are the contract both the frontend and backend honor, the same way we'd build
// against a GraphQL contract before the resolver exists. Keep them in sync with the
// backend controllers by hand.

// ---------------------------------------------------------------------------
// Route paths — the ONE place auth path strings live. Do not scatter literals.
//
// ⚠️ These two endpoints are freshly written on the backend and may not be wired to
// routes yet (authRouter.ts currently has login/signup/logout/forgot-password/
// reset-password/publicAccess/me). Confirm the real paths with the backend and change
// them here — every call site reads from this constant, so it's a one-line fix.
// ---------------------------------------------------------------------------
export const AUTH_ROUTES = {
  // Existence-blind: request a verification code for an email. Never mints users.
  emailVerification: '/auth/email-verification',
  // Verifies the code AND sets the password in one call; server sets the session cookie.
  setPassword: '/auth/set-password',
} as const;

// ---------------------------------------------------------------------------
// email-verification endpoint — the existence-blind door.
// ALWAYS HTTP 200, ALWAYS this shape, regardless of whether the email is new, already
// an account, or garbage.
// ---------------------------------------------------------------------------
export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// set-password endpoint — verifies the code AND sets the password in ONE call.
// The `firstName`/`lastName`/`phone`/`smsOptIn` fields are sent by the SIGNUP door
// only; the forgot-password door sends none. The door the user chose carries the
// create-vs-reset intent — never a response field (that would leak existence).
// ---------------------------------------------------------------------------
export interface SetPasswordRequest {
  email: string;
  code: string;
  password: string;
  firstName?: string; // signup door only
  lastName?: string; // signup door only
  phone?: string; // optional
  smsOptIn?: boolean; // optional
}

// SUCCESS: HTTP 200. Server sets an httpOnly `token` cookie (the FE cannot read it).
// Treat 200 as "logged in".
export interface SetPasswordSuccess {
  message: string;
  email: string;
}

// FAILURE (code-level only, safe to surface): HTTP 400.
export type SetPasswordErrorReason = 'INVALID_CODE' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS';

export interface SetPasswordError {
  error: SetPasswordErrorReason;
}

// ---------------------------------------------------------------------------
// Client-side result shapes (discriminated). The client normalizes transport +
// existence-blind responses into these so call sites never inspect HTTP status.
// ---------------------------------------------------------------------------
export type EmailVerificationResult =
  | { ok: true; message: string }
  // Transport/unexpected failure ONLY — this is never an existence signal. The
  // endpoint is existence-blind, so `ok: false` here means the network/server broke,
  // not "no account". Callers must not infer account existence from it.
  | { ok: false };

export type SetPasswordResult =
  | { ok: true; email: string }
  // Code-level failure, safe to surface with friendly copy. Route the user back to
  // the code step; do not dump them out.
  | { ok: false; reason: SetPasswordErrorReason };
