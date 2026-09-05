import type { AppError } from '../../../domain/errors/errorTypes';
import type { AlbumSharingExtrasQuery } from '../../../graphql/generated/types';

type ServerEmailShare = NonNullable<
  NonNullable<AlbumSharingExtrasQuery['viewer']>['album']
>['emailShares'][number];

/**
 * Whether the invite email actually reached the person, as reported by SES and
 * collapsed server-side to three states. Shaped off the query type so the enum
 * and the timestamp can't drift from the schema.
 *
 * DELIVERED means the receiving server accepted the message — not that anyone
 * read it. Never render it as "Read" or "Seen"; it may be sitting in spam.
 */
export type ShareRowDelivery = NonNullable<ServerEmailShare['delivery']>;

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
  /**
   * Deliberately SEPARATE from `state`, which means "did the share mutation
   * succeed this session". A bounced invite is still real access — it must keep
   * counting toward the roster header, and its row keeps the revoke action.
   * Server-sourced only, so a row added this session carries none until its
   * refetched twin supplies one (the rule userId already follows).
   */
  delivery?: ShareRowDelivery;
};

/**
 * The email input splits typed and pasted entries on these (plus all
 * whitespace, which MultiCombobox always adds for paste).
 */
export const EMAIL_SEPARATORS = [',', ';', ' '] as const;
