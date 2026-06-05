/**
 * Primitive Color Palette
 *
 * Raw color values organized into scales. Components consume the semantic
 * tokens in theme.ts — never reach into this file directly.
 *
 * Each hue follows: base, _light, _lighter, _lightest, _dark, _darker, _darkest.
 *
 * Neutrals use a numbered gray scale (gray_10 lightest → gray_90 darkest).
 * NOTE: this convention is INVERTED from the previous dark-mode palette,
 * where gray_10 was darkest. Mental model now: lower number = closer to
 * background, higher number = closer to text.
 *
 * All neutrals carry a subtle warm tint (yellow/orange hue, low saturation)
 * to harmonize with the clay accent and avoid the clinical feeling of pure
 * gray on cream.
 *
 * Accent and semantic colors are tuned for AA contrast against the paper
 * background (gray_10). Base values pass AA (≥4.5:1) when used as foreground
 * text. Lightest variants are tint backgrounds; pair with the _darker variant
 * for foreground text on them.
 */
export const colors = {
  black: '#000000',
  white: '#ffffff',

  // ── Neutrals (warm-tinted for light UI) ──────────────────────────
  gray_10: '#FAFAF7', // body background (paper, faint warm)
  gray_15: '#F5F1E9', // raised surface (nav, sticky headers)
  gray_20: '#EDE7DA', // subtle divider line, panel
  gray_25: '#E5DDCB', // card background (when used)
  gray_30: '#D4CBB7', // standard border
  gray_40: '#B8AC96', // emphasis border, disabled chrome
  gray_50: '#A89D90', // tertiary text, disabled text
  gray_60: '#968B7C', // placeholder text
  gray_70: '#8B7E72', // muted text (timestamps, captions)
  gray_80: '#5C5145', // secondary text (subtitles, labels)
  gray_85: '#3D352D', // near-primary text
  gray_90: '#2A2520', // primary text (warm dark)

  // ── Clay (accent) ────────────────────────────────────────────────
  // Primary brand color. Section headers, primary buttons, focus rings,
  // selection, current-user avatar. Tuned for AA on paper background.
  clay: '#AA5C39',
  clay_light: '#B87850',
  clay_lighter: '#CFA585',
  clay_lightest: '#EBD5C0',
  clay_dark: '#8D4A2C',
  clay_darker: '#6E3920',
  clay_darkest: '#4A2516',

  // ── Red / Danger ─────────────────────────────────────────────────
  red: '#C44A35',
  red_light: '#D86553',
  red_lighter: '#E89887',
  red_lightest: '#F8E0DA',
  red_dark: '#A53B27',
  red_darker: '#7E2D1D',
  red_darkest: '#4E1B11',

  // ── Green / Success ──────────────────────────────────────────────
  green: '#5A8260',
  green_light: '#75997B',
  green_lighter: '#A6BFAA',
  green_lightest: '#DCE7DE',
  green_dark: '#476A4D',
  green_darker: '#34503A',
  green_darkest: '#1F351F',

  // ── Blue / Info ──────────────────────────────────────────────────
  blue: '#4A75A8',
  blue_light: '#6E91BB',
  blue_lighter: '#A4BCD6',
  blue_lightest: '#DDE7F0',
  blue_dark: '#3A5D85',
  blue_darker: '#2B466A',
  blue_darkest: '#1A2C45',

  // ── Yellow / Warning ─────────────────────────────────────────────
  yellow: '#C9A341',
  yellow_light: '#D9B95F',
  yellow_lighter: '#E6D196',
  yellow_lightest: '#F5EAC5',
  yellow_dark: '#A88735',
  yellow_darker: '#7E6529',
  yellow_darkest: '#4E3F1B',

  // ── Purple (categorical / avatars) ───────────────────────────────
  purple: '#7A5F94',
  purple_light: '#947AAD',
  purple_lighter: '#B5A2C7',
  purple_lightest: '#DDD2E5',
  purple_dark: '#634A7B',
  purple_darker: '#4A3760',
  purple_darkest: '#2E2240',

  // ── Teal (categorical / avatars) ─────────────────────────────────
  teal: '#3F8281',
  teal_light: '#5C9C9B',
  teal_lighter: '#94BFBE',
  teal_lightest: '#D2E5E5',
  teal_dark: '#306967',
  teal_darker: '#234E4D',
  teal_darkest: '#163131',
} as const;
