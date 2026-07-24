// Single source of truth for Homeroll email styling.
//
// These palette values intentionally DUPLICATE apps/web/src/styles/colors.ts.
// The web palette cannot be imported here: @packages/notifications is a
// layer:context package and must not depend on an app (apps/web). If the brand
// palette moves, update both by hand. Mapping to colors.ts primitives noted inline.

import type { CSSProperties } from 'react';

export const emailColors = {
  outerBg: '#F5F1E9', // gray_15
  card: '#FFFDF9', // gray_05 (print white)
  accent: '#AA5C39', // clay — links, wordmark
  buttonBg: '#8D4A2C', // clay_dark (AA)
  textPrimary: '#2A2520', // gray_90
  textSecondary: '#5C5145', // gray_80
  textMuted: '#8B7E72', // gray_70
  hairline: '#E8E1D5', // no exact colors.ts token
} as const;

// Web-safe-terminated stacks. NO @font-face / web fonts — they don't load in email.
export const fontStacks = {
  serif: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
} as const;

// ── surfaces ──────────────────────────────────────────────
export const bodyStyle: CSSProperties = {
  backgroundColor: emailColors.outerBg,
  fontFamily: fontStacks.sans,
  margin: 0,
  padding: '40px 12px',
};

export const outerBgStyle: CSSProperties = {
  backgroundColor: emailColors.outerBg,
};

export const cardStyle: CSSProperties = {
  backgroundColor: emailColors.card,
  borderRadius: '4px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px',
};

// ── type roles ────────────────────────────────────────────
export const wordmarkStyle: CSSProperties = {
  fontFamily: fontStacks.serif,
  color: emailColors.accent,
  fontSize: '16px',
  fontWeight: 500,
  margin: 0,
};

export const h1Style: CSSProperties = {
  fontFamily: fontStacks.serif,
  color: emailColors.textPrimary,
  fontSize: '28px',
  fontWeight: 500,
  lineHeight: '1.3',
  margin: '0 0 16px',
};

export const bodyTextStyle: CSSProperties = {
  fontFamily: fontStacks.sans,
  color: emailColors.textPrimary,
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: '1.6',
  margin: '0 0 12px',
};

export const secondaryTextStyle: CSSProperties = {
  fontFamily: fontStacks.sans,
  color: emailColors.textSecondary,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 6px',
};

export const footerTextStyle: CSSProperties = {
  fontFamily: fontStacks.sans,
  color: emailColors.textMuted,
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
};

// ── elements ──────────────────────────────────────────────
export const hrStyle: CSSProperties = {
  borderColor: emailColors.hairline,
  borderStyle: 'solid',
  borderWidth: '1px 0 0',
  margin: '28px 0',
};

export const buttonStyle: CSSProperties = {
  backgroundColor: emailColors.buttonBg,
  borderRadius: '4px',
  color: emailColors.card,
  display: 'inline-block',
  fontFamily: fontStacks.sans,
  fontSize: '14px',
  fontWeight: 500,
  padding: '14px 28px',
  textDecoration: 'none',
};

// Inline text link (e.g. the mailto in passwordChanged). Clay, underlined so
// it reads as a link mid-sentence. Weight stays at 500 — the copy rule caps
// weight at 500.
export const linkStyle: CSSProperties = {
  color: emailColors.accent,
  fontWeight: 500,
  textDecoration: 'underline',
};

export const linkFallbackStyle: CSSProperties = {
  fontFamily: fontStacks.sans,
  color: emailColors.textSecondary,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: 0,
  wordBreak: 'break-all',
  overflowWrap: 'anywhere',
};

// ── footer variants ───────────────────────────────────────
export const footerCopy = {
  transactional:
    "You're receiving this because someone entered this address on Homeroll. If that wasn't you, you can ignore it.",
  notification: "You're receiving this because you're on this album on Homeroll.",
  shareLink: 'Someone sent you this album on Homeroll.',
} as const;

export type FooterVariant = keyof typeof footerCopy;
