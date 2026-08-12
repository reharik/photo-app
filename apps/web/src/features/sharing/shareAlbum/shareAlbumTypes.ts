import type { AppError } from '../../../domain/errors/errorTypes';

/**
 * account/noAccount drives the shared-with row asymmetry: resolved accounts get
 * the promote dropdown ("Can view" → Contributor/Admin), unresolved emails are
 * pinned to a static "Can view" — membership requires an active account.
 * 'pending' renders while the resolve query is in flight.
 */
export type ShareRowResolution = 'pending' | 'account' | 'noAccount';

/**
 * Lifecycle of a row added this session. There is no draft state: the share
 * mutation fires the moment the email is committed, so a local row is born
 * 'sending' and settles to 'shared' or 'failed'.
 */
export type ShareRowSendState = 'sending' | 'shared' | 'failed';

/** A row created by the email input this session (not yet — or just — persisted). */
export type LocalShareRow = {
  email: string;
  resolution: ShareRowResolution;
  displayName?: string;
  sendState: ShareRowSendState;
  error?: AppError;
};

/**
 * What the SHARED WITH group renders: server email shares merged with this
 * session's local rows (a local row supersedes its server twin — it carries the
 * fresher state).
 */
export type SharedWithRowVM = {
  email: string;
  displayName?: string;
  /** undefined = account status unknown (resolve in flight, or degraded). */
  hasAccount?: boolean;
  /**
   * Only ever sourced from the persisted EmailShare row (the resolve query
   * returns no ids on purpose) — promotion needs it, so a just-added row can't
   * be promoted until its refetched server twin supplies the id.
   */
  userId?: string;
  /** 'persisted' = loaded from the server; the rest are this session's adds. */
  state: 'resolving' | 'sharing' | 'shared' | 'persisted' | 'failed';
  error?: AppError;
};

/**
 * The email input splits typed and pasted entries on these (plus all
 * whitespace, which MultiCombobox always adds for paste).
 */
export const EMAIL_SEPARATORS = [',', ';', ' '] as const;
