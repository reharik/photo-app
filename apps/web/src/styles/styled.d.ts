import 'styled-components';
import { colors } from './colors';

declare module 'styled-components' {
  export interface DefaultTheme {
    /* ── Layout ──────────────────────────────────────────── */
    breakpoints: {
      mobile: string;
      tabletUp: string;
      tabletDown: string;
      desktopUp: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    boxShadow: {
      sm: string;
      md: string;
      lg: string;
    };
    spacing: (n: number) => string;

    /* ── Typography ──────────────────────────────────────── */
    font: {
      body: string;
      mono: string;
    };
    fontSize: {
      _32: string;
      _24: string;
      _21: string;
      _18: string;
      _16: string;
      _14: string;
      _12: string;
      _10: string;
    };
    weight: {
      regular: number;
      medium: number;
      semi: number;
      bold: number;
    };

    /* ── Semantic Color Tokens ────────────────────────────── */
    color: {
      /* General */
      white: string;
      black: string;

      /* Body / Surfaces */
      body: string;
      bodyRaised: string;
      bodyElevated: string;
      bodyText: string;
      bodyTextSecondary: string;
      bodyTextMuted: string;

      /* Cards / Panels */
      cardBg: string;
      cardBorder: string;

      /* Links */
      link: string;
      linkHover: string;
      linkActive: string;
      linkDisabled: string;

      /* Buttons */
      primaryButtonBg: string;
      primaryButtonHover: string;
      primaryButtonText: string;
      secondaryButtonBg: string;
      secondaryButtonBorder: string;
      secondaryButtonText: string;
      secondaryButtonHover: string;
      ghostButtonText: string;
      ghostButtonHover: string;
      dangerButtonBg: string;
      dangerButtonText: string;
      buttonDisabled: string;
      buttonDisabledText: string;

      /* Alerts / Status */
      alertError: string;
      alertErrorText: string;
      alertWarning: string;
      alertWarningText: string;
      alertSuccess: string;
      alertSuccessText: string;
      alertInfo: string;
      alertInfoText: string;

      /* Forms */
      formError: string;
      inputBg: string;
      inputBorder: string;
      inputBorderHover: string;
      inputBorderFocus: string;
      inputText: string;
      inputPlaceholder: string;
      inputDisabledBg: string;
      inputDisabledText: string;
      label: string;
      checkboxBorder: string;

      /* Tables */
      tableBorder: string;
      tableHeaderText: string;
      cellHoverBg: string;

      /* Borders / Separators */
      border: string;
      borderSubtle: string;
      separator: string;

      /* Text */
      textPrimary: string;
      textSecondary: string;
      textMuted: string;
      textDisabled: string;
      textAccent: string;
      textDanger: string;
      textSuccess: string;
      textInfo: string;
      textWarning: string;

      /* Loading */
      loadingDot: string;
      loadingSpinner: string;

      /* Avatars */
      avatarBg1: string;
      avatarBg2: string;
      avatarBg3: string;
      avatarBg4: string;
      avatarBg5: string;
      avatarBg6: string;
      avatarText: string;

      /* Selection */
      selectionBg: string;
      selectionText: string;

      /* Scrollbar */
      scrollTrack: string;
      scrollThumb: string;
      scrollThumbHover: string;

      /* Data Visualization */
      graphPrimary: string;
      graphSecondary: string;
      graphTertiary: string;
      graphDanger: string;
      graphSuccess: string;
      graphWarning: string;
      graphGrid: string;
      graphLabel: string;
    } & typeof colors;

    /* ── Backward-compat aliases (remove after migration) ── */
    colors: {
      bg: string;
      panel: string;
      border: string;
      text: string;
      textMuted: string;
      subtext: string;
      accent: string;
      accentHover: string;
      danger: string;
      ok: string;
    };
    radius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    shadow: {
      sm: string;
      md: string;
    };
  }
}
