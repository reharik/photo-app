import { DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  colors: {
    bg: '#111315', // Warm near-black background
    panel: '#181b1f', // Raised surface (keeping 'panel' for backward compat)
    border: '#2a2f36', // Subtle borders
    text: '#f3f1ec', // Primary cream text
    subtext: '#b7b0a4', // Secondary beige text
    accent: '#a8927a', // Muted amber accent
    accentHover: '#c4a882', // Lighter amber on hover
    danger: '#d98c7e', // Muted red for errors/destructive actions
    ok: '#8b9d88', // Muted sage for success
    textMuted: '#b7b0a4', // Secondary beige text
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
  font: {
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
  },
  spacing: (n: number) => `${n * 8}px`, // 8px base unit
};
