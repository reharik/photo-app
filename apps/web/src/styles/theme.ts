import { DefaultTheme } from 'styled-components';
import { colors } from './colors';

export enum MaxWidthBreakpoint {
  Mobile = 500,
  Tablet = 768,
}

export enum MinWidthBreakpoint {
  Tablet = 501,
  Desktop = 801,
}

export const theme: DefaultTheme = {
  breakpoints: {
    mobile: `@media screen and (max-width: ${MaxWidthBreakpoint.Mobile}px)`,
    tabletUp: `@media screen and (min-width: ${MinWidthBreakpoint.Tablet}px)`,
    tabletDown: `@media screen and (max-width: ${MaxWidthBreakpoint.Tablet}px)`,
    desktopUp: `@media screen and (min-width: ${MinWidthBreakpoint.Desktop}px)`,
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  boxShadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },

  spacing: (n: number) => `${n * 8}px`, // 8px base unit

  font: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
  },

  fontSize: {
    _32: '32px',
    _24: '24px',
    _21: '21px',
    _18: '18px',
    _16: '16px',
    _14: '14px',
    _12: '12px',
    _10: '10px',
  },

  weight: {
    regular: 400,
    medium: 500,
    semi: 600,
    bold: 700,
  },

  color: {
    /* ── General ─────────────────────────────────────────── */
    white: colors.white,
    black: colors.black,

    /* ── Body / Surfaces ─────────────────────────────────── */
    body: colors.gray_10,
    bodyRaised: colors.gray_15,
    bodyElevated: colors.gray_20,
    bodyText: colors.gray_90,
    bodyTextSecondary: colors.gray_80,
    bodyTextMuted: colors.gray_70,

    /* ── Cards / Panels ──────────────────────────────────── */
    cardBg: colors.gray_25,
    cardBorder: colors.gray_30,

    /* ── Links ────────────────────────────────────────────── */
    link: colors.amber,
    linkHover: colors.amber_light,
    linkActive: colors.amber_dark,
    linkDisabled: colors.gray_50,

    /* ── Buttons ──────────────────────────────────────────── */
    primaryButtonBg: colors.amber,
    primaryButtonHover: colors.amber_light,
    primaryButtonText: colors.gray_10,
    secondaryButtonBg: 'transparent',
    secondaryButtonBorder: colors.gray_40,
    secondaryButtonText: colors.gray_90,
    secondaryButtonHover: colors.gray_20,
    ghostButtonText: colors.gray_80,
    ghostButtonHover: colors.gray_20,
    dangerButtonBg: colors.red,
    dangerButtonText: colors.gray_10,
    buttonDisabled: colors.gray_40,
    buttonDisabledText: colors.gray_50,

    /* ── Alerts / Status ─────────────────────────────────── */
    alertError: colors.red,
    alertErrorText: colors.red_light,
    alertWarning: colors.yellow,
    alertWarningText: colors.yellow_light,
    alertSuccess: colors.green,
    alertSuccessText: colors.green_light,
    alertInfo: colors.blue,
    alertInfoText: colors.blue_light,

    /* ── Forms ────────────────────────────────────────────── */
    formError: colors.red,
    inputBg: colors.gray_10,
    inputBorder: colors.gray_30,
    inputBorderHover: colors.amber_dark,
    inputBorderFocus: colors.amber,
    inputText: colors.gray_90,
    inputPlaceholder: colors.gray_70,
    inputDisabledBg: colors.gray_20,
    inputDisabledText: colors.gray_50,
    label: colors.gray_80,
    checkboxBorder: colors.gray_50,

    /* ── Tables ───────────────────────────────────────────── */
    tableBorder: colors.gray_30,
    tableHeaderText: colors.gray_80,
    cellHoverBg: 'rgba(255, 255, 255, 0.02)',

    /* ── Borders / Separators ────────────────────────────── */
    border: colors.gray_30,
    borderSubtle: colors.gray_40,
    separator: colors.gray_30,

    /* ── Text ─────────────────────────────────────────────── */
    textPrimary: colors.gray_90,
    textSecondary: colors.gray_80,
    textMuted: colors.gray_70,
    textDisabled: colors.gray_50,
    textAccent: colors.amber,
    textDanger: colors.red,
    textSuccess: colors.green,
    textInfo: colors.blue,
    textWarning: colors.yellow,

    /* ── Loading ──────────────────────────────────────────── */
    loadingDot: colors.gray_80,
    loadingSpinner: colors.amber,

    /* ── Avatars ──────────────────────────────────────────── */
    avatarBg1: colors.amber_darker,
    avatarBg2: colors.blue_darker,
    avatarBg3: colors.green_darker,
    avatarBg4: colors.purple_darker,
    avatarBg5: colors.teal_darker,
    avatarBg6: colors.red_darker,
    avatarText: colors.gray_90,

    /* ── Selection highlight ──────────────────────────────── */
    selectionBg: colors.amber,
    selectionText: colors.gray_10,

    /* ── Scrollbar ────────────────────────────────────────── */
    scrollTrack: colors.gray_10,
    scrollThumb: colors.gray_30,
    scrollThumbHover: colors.gray_80,

    /* ── Data Visualization ───────────────────────────────── */
    graphPrimary: colors.teal,
    graphSecondary: colors.amber,
    graphTertiary: colors.blue,
    graphDanger: colors.red,
    graphSuccess: colors.green,
    graphWarning: colors.yellow,
    graphGrid: colors.gray_30,
    graphLabel: colors.gray_70,
  },

  // ── Backward-compat aliases ─────────────────────────────────
  // These map old `theme.colors.*` / `theme.radius.*` / etc. to the
  // new token names so existing components don't break. Remove these
  // once you've migrated all consumers.
  colors: {
    bg: colors.gray_10,
    panel: colors.gray_15,
    border: colors.gray_30,
    text: colors.gray_90,
    subtext: colors.gray_80,
    accent: colors.amber,
    accentHover: colors.amber_light,
    danger: colors.red,
    ok: colors.green,
    textMuted: colors.gray_70,
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
};
