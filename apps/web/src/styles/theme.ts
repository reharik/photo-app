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

  // Softened for light surfaces. Heavy dark-mode rgba values bruised the cream.
  // Shadow color is a warm-dark tint, not pure black, so shadows still feel
  // part of the warm palette rather than punching a cool hole in it.
  boxShadow: {
    sm: '0 1px 2px rgba(58, 42, 28, 0.06)',
    md: '0 2px 8px rgba(58, 42, 28, 0.08)',
    lg: '0 6px 20px rgba(58, 42, 28, 0.10)',
  },

  spacing: (n: number) => `${n * 8}px`, // 8px base unit

  font: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
    // Editorial serif for wordmark, section headers, anywhere we want
    // "this is a curated moment." Iowan Old Style ships on macOS/iOS,
    // Charter on macOS, Cambria on Windows, Georgia everywhere.
    serif: "'Iowan Old Style', Charter, 'Hoefler Text', Cambria, Georgia, serif",
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
  },

  fontSize: {
    _32: '32px',
    _24: '24px',
    _21: '21px',
    _18: '18px',
    _17: '17px', // wordmark, chapter labels
    _16: '16px', // section headers, body
    _14: '14px',
    _13: '13px', // nav items, badges
    _12: '12px',
    _10: '10px',
  },

  weight: {
    regular: 400,
    medium: 500,
    // 600/700 retained for backward compat. Prefer `medium` for new components —
    // heavy weights read aggressive against the warm cream palette and clash
    // with the editorial serif at heading sizes.
    semi: 600,
    bold: 700,
  },

  color: {
    /* ── Body / Surfaces ─────────────────────────────────── */
    body: colors.gray_10,                // paper white
    bodyRaised: colors.gray_15,          // nav, sticky headers
    bodyElevated: colors.gray_20,        // subtle panels
    stageDark: colors.gray_85,           // photo lightbox stage (warm dark, not pure black)
    bodyText: colors.gray_90,            // primary text
    bodyTextSecondary: colors.gray_80,   // subtitles
    bodyTextMuted: colors.gray_70,       // metadata, timestamps

    /* ── Cards / Panels ──────────────────────────────────── */
    cardBg: colors.gray_15,
    cardBorder: colors.gray_30,

    /* ── Links ────────────────────────────────────────────── */
    link: colors.clay,
    linkHover: colors.clay_dark,
    linkActive: colors.clay_darker,
    linkDisabled: colors.gray_50,

    /* ── Buttons ──────────────────────────────────────────── */
    // Primary button uses clay_dark so the cream-on-clay text passes AA.
    // clay base alone is 3.8:1 with paper text — fine for section headers
    // (foreground on body) but borderline for filled button backgrounds.
    primaryButtonBg: colors.clay_dark,
    primaryButtonHover: colors.clay_darker,
    primaryButtonText: colors.gray_10,
    secondaryButtonBg: 'transparent',
    secondaryButtonBorder: colors.gray_30,
    secondaryButtonText: colors.gray_90,
    secondaryButtonHover: colors.gray_15,
    ghostButtonText: colors.gray_80,
    ghostButtonHover: colors.gray_15,
    dangerButtonBg: colors.red,
    dangerButtonText: colors.gray_10,
    buttonDisabled: colors.gray_30,
    buttonDisabledText: colors.gray_50,

    /* ── Alerts / Status ─────────────────────────────────── */
    // Tint-backgrounds pair with their _darker text for AA contrast.
    alertError: colors.red_lightest,
    alertErrorText: colors.red_darker,
    alertWarning: colors.yellow_lightest,
    alertWarningText: colors.yellow_darker,
    alertSuccess: colors.green_lightest,
    alertSuccessText: colors.green_darker,
    alertInfo: colors.blue_lightest,
    alertInfoText: colors.blue_darker,

    /* ── Forms ────────────────────────────────────────────── */
    formError: colors.red,
    inputBg: colors.gray_10,
    inputBorder: colors.gray_30,
    inputBorderHover: colors.clay_light,
    inputBorderFocus: colors.clay,
    inputText: colors.gray_90,
    inputPlaceholder: colors.gray_60,
    inputDisabledBg: colors.gray_15,
    inputDisabledText: colors.gray_50,
    label: colors.gray_80,
    checkboxBorder: colors.gray_40,

    /* ── Tables ───────────────────────────────────────────── */
    tableBorder: colors.gray_30,
    tableHeaderText: colors.gray_80,
    // Flipped from rgba(255,255,255, .02) — dark hover on light surface.
    cellHoverBg: 'rgba(58, 42, 28, 0.03)',

    /* ── Borders / Separators ────────────────────────────── */
    border: colors.gray_30,
    borderSubtle: colors.gray_20,
    separator: colors.gray_20,

    /* ── Text ─────────────────────────────────────────────── */
    textPrimary: colors.gray_90,
    textSecondary: colors.gray_80,
    textMuted: colors.gray_70,
    textDisabled: colors.gray_50,
    textAccent: colors.clay,
    textDanger: colors.red,
    textSuccess: colors.green_dark,
    textInfo: colors.blue_dark,
    textWarning: colors.yellow_dark,

    /* ── Notifications ────────────────────────────────────── */
    // Unseen-activity dot (cards, nav, future media items). Semantic alias of
    // the `notify` primitive — its own token so it stays put if `error` retunes.
    unseen: colors.notify,

    /* ── Loading ──────────────────────────────────────────── */
    loadingDot: colors.gray_70,
    loadingSpinner: colors.clay,

    /* ── Avatars ──────────────────────────────────────────── */
    // 6 distinct family-member colors. Each is the base of its family,
    // chosen for AA contrast with paper-white avatar text.
    avatarBg1: colors.clay,
    avatarBg2: colors.blue,
    avatarBg3: colors.green,
    avatarBg4: colors.purple,
    avatarBg5: colors.teal,
    avatarBg6: colors.yellow_dark,
    avatarText: colors.gray_10,

    /* ── Selection highlight ──────────────────────────────── */
    // Light clay tint for selected list items, multi-select, range-select.
    // Photo-grid selection uses primaryButtonBg (clay_dark) as ring color —
    // see the grid component, not this token.
    selectionBg: colors.clay_lightest,
    selectionText: colors.gray_90,

    /* ── Scrollbar ────────────────────────────────────────── */
    scrollTrack: colors.gray_10,
    scrollThumb: colors.gray_30,
    scrollThumbHover: colors.gray_50,

    /* ── Data Visualization ───────────────────────────────── */
    graphPrimary: colors.clay,
    graphSecondary: colors.teal,
    graphTertiary: colors.blue,
    graphDanger: colors.red,
    graphSuccess: colors.green,
    graphWarning: colors.yellow_dark,
    graphGrid: colors.gray_25,
    graphLabel: colors.gray_70,

    /* ── Primitive escape hatch (legacy — avoid in new code) ─ */
    // Keeps components that reach into `theme.color.gray_50` etc. building
    // while you migrate them to semantic tokens. Audit and remove later.
    ...colors,
  },

  // ── Backward-compat aliases ─────────────────────────────────────────
  // Old `theme.colors.*` / `theme.radius.*` / `theme.shadow.*` access points.
  // Pointed at the new palette so existing components keep rendering.
  // Remove once migrated.
  colors: {
    bg: colors.gray_10,
    panel: colors.gray_15,
    border: colors.gray_30,
    text: colors.gray_90,
    subtext: colors.gray_80,
    accent: colors.clay,
    accentHover: colors.clay_dark,
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
    sm: '0 1px 2px rgba(58, 42, 28, 0.06)',
    md: '0 2px 8px rgba(58, 42, 28, 0.08)',
  },
};
