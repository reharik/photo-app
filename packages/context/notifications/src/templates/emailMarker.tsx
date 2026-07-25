import { ReactElement } from 'react';

/**
 * Machine-readable, human-invisible markers embedded in every email.
 *
 * Purpose: let tests (and any future tooling) identify an email by WHAT IT IS —
 * which template, and which activity sections it carries — instead of by its
 * visible copy, which we rewrite freely. Asserting on `pa:section=reaction` never
 * breaks when "reacted to your" becomes "liked your".
 *
 * The tokens render into the HTML body (which is all the e2e SES assertions read)
 * but stay hidden from real mail clients: `display:none` plus zero-size/opacity
 * belt-and-suspenders, the same technique preheader text uses.
 *
 * Token grammar (space-separated): `pa:email=<templateName>` and, for the activity
 * digest, one `pa:section=<album|comment|reaction>` per rendered section.
 *
 * ⚠️ These token strings are a contract with the e2e suite. If you change the
 * prefix or grammar, update `packages/e2e/fixtures/emailMarkers.ts` in lockstep.
 */

export const EMAIL_MARKER_PREFIX = 'pa';

export const emailKindMarker = (kind: string): string => `${EMAIL_MARKER_PREFIX}:email=${kind}`;

export const sectionMarker = (section: string): string =>
  `${EMAIL_MARKER_PREFIX}:section=${section}`;

// Hidden every way that matters: out of the layout (display/size), out of sight
// (opacity/color) for the odd client that ignores display:none.
const hiddenStyle = {
  display: 'none',
  maxHeight: 0,
  maxWidth: 0,
  overflow: 'hidden',
  opacity: 0,
  color: 'transparent',
} as const;

export const EmailMarker = ({ tokens }: { tokens: string[] }): ReactElement => (
  <div data-email-markers="" style={hiddenStyle}>
    {tokens.join(' ')}
  </div>
);
