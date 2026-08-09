import type { AppError } from '../../../domain/errors/errorTypes';
import type { ShareAccessLevel } from './preSdlShareDocuments';

/**
 * account/noAccount drives the compose-row asymmetry: resolved accounts get a
 * role dropdown, unresolved emails are pinned to a static "Can view" (membership
 * requires an active account). 'pending' renders while the resolve query is
 * in flight.
 */
export type RecipientResolution = 'pending' | 'account' | 'noAccount';

export type RecipientSendState = 'draft' | 'sending' | 'failed';

export type PendingRecipient = {
  email: string;
  accessLevel: ShareAccessLevel;
  resolution: RecipientResolution;
  displayName?: string;
  sendState: RecipientSendState;
  error?: AppError;
};

export const ACCESS_LEVEL_LABELS: Record<ShareAccessLevel, string> = {
  VIEWER: 'Can view',
  CONTRIBUTOR: 'Contributor',
  ADMIN: 'Admin',
};

/**
 * Both email inputs (manage + compose) split typed and pasted entries on these
 * (plus all whitespace, which MultiCombobox always adds for paste).
 */
export const EMAIL_SEPARATORS = [',', ';', ' '] as const;
