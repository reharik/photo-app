import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
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
    font: {
      mono: string;
      body: string;
    };
    spacing: (n: number) => string;
  }
}
