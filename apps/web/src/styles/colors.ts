/**
 * Primitive Color Palette
 *
 * Raw color values organized into scales. These are never consumed
 * directly by components — they feed into the semantic tokens in theme.ts.
 *
 * Each hue follows the naming convention:
 *   base, _light, _lighter, _lightest, _dark, _darker, _darkest
 *
 * Neutrals use a numbered gray scale (gray_10 darkest → gray_90 lightest).
 */
export const colors = {
  black: '#000000',
  white: '#ffffff',

  // ── Neutrals (warm-tinted for dark UI) ──────────────────────────
  gray_10: '#111315', // app background
  gray_15: '#181b1f', // raised surface / panel
  gray_20: '#1e2228', // elevated surface
  gray_25: '#252a31', // card / modal bg
  gray_30: '#2a2f36', // borders, dividers
  gray_40: '#3a4049', // subtle borders, hover states
  gray_50: '#555d68', // disabled text
  gray_60: '#7a828d', // placeholder text
  gray_70: '#9ca3ad', // muted text
  gray_80: '#b7b0a4', // secondary text (warm beige)
  gray_85: '#d4cdc1', // near-primary text
  gray_90: '#f3f1ec', // primary text (cream)

  // ── Amber (accent) ─────────────────────────────────────────────
  amber: '#a8927a',
  amber_light: '#c4a882',
  amber_lighter: '#d4be9e',
  amber_lightest: '#e8dbc8',
  amber_dark: '#8c7a65',
  amber_darker: '#6e604f',
  amber_darkest: '#4a3f35',

  // ── Red / Danger ───────────────────────────────────────────────
  red: '#d98c7e',
  red_light: '#e4a89d',
  red_lighter: '#edc3bb',
  red_lightest: '#f5deda',
  red_dark: '#c47060',
  red_darker: '#a85445',
  red_darkest: '#7a3529',

  // ── Green / Success ────────────────────────────────────────────
  green: '#8b9d88',
  green_light: '#a3b5a0',
  green_lighter: '#bdccba',
  green_lightest: '#d7e3d5',
  green_dark: '#718e6d',
  green_darker: '#5a7256',
  green_darkest: '#3e503b',

  // ── Blue / Info ────────────────────────────────────────────────
  blue: '#7c9ccc',
  blue_light: '#9bb4db',
  blue_lighter: '#b9cce8',
  blue_lightest: '#d8e3f3',
  blue_dark: '#6284b5',
  blue_darker: '#4b6d9e',
  blue_darkest: '#334d73',

  // ── Yellow / Warning ───────────────────────────────────────────
  yellow: '#d4b87a',
  yellow_light: '#dfca98',
  yellow_lighter: '#eadcb7',
  yellow_lightest: '#f4eed6',
  yellow_dark: '#bfa260',
  yellow_darker: '#a08548',
  yellow_darkest: '#6e5b30',

  // ── Purple ─────────────────────────────────────────────────────
  purple: '#a293c4',
  purple_light: '#b8acd4',
  purple_lighter: '#cec5e3',
  purple_lightest: '#e4def1',
  purple_dark: '#8978ad',
  purple_darker: '#6f5f96',
  purple_darkest: '#4d4169',

  // ── Teal ───────────────────────────────────────────────────────
  teal: '#7aadab',
  teal_light: '#98c1bf',
  teal_lighter: '#b6d5d3',
  teal_lightest: '#d5e8e7',
  teal_dark: '#5f9694',
  teal_darker: '#487c7a',
  teal_darkest: '#325756',
} as const;
