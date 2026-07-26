/**
 * Hidden, machine-readable markers embedded in every email by the notifications
 * package. Asserting on these instead of visible copy keeps the email e2e specs
 * from breaking every time we reword a subject line or a section header.
 *
 * ⚠️ These strings mirror the token grammar in
 * `packages/context/notifications/src/templates/emailMarker.tsx`. The e2e package
 * intentionally does NOT depend on the notifications package (it would drag React
 * and the whole render stack into the Playwright runtime), so the two are kept in
 * sync by hand — change one, change the other.
 */

const EMAIL_MARKER_PREFIX = 'pa';

/** Identifies which template an email was rendered from. */
export const emailKindMarker = (kind: string): string => `${EMAIL_MARKER_PREFIX}:email=${kind}`;

/** Identifies an activity-digest section (album / comment / reaction). */
export const sectionMarker = (section: 'album' | 'comment' | 'reaction'): string =>
  `${EMAIL_MARKER_PREFIX}:section=${section}`;
