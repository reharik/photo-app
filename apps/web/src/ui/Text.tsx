/**
 * Typography primitives — reusable styled text components that consume
 * the theme's fontSize / weight / color tokens.
 *
 * Ported from the Linus design system, adapted for the dark palette.
 */
import styled from 'styled-components';

export const H1 = styled.h1(
  ({ theme: { color, fontSize, weight } }) => `
    color: ${color.bodyText};
    font-size: ${fontSize._32};
    line-height: 1.25;
    letter-spacing: 0.2px;
    font-weight: ${weight.medium};
  `,
);

export const H2 = styled.h2(
  ({ theme: { color, fontSize, weight } }) => `
    color: ${color.bodyText};
    font-size: ${fontSize._24};
    line-height: 1.3;
    letter-spacing: 0.2px;
    font-weight: ${weight.medium};
  `,
);

export const H3 = styled.h3(
  ({ theme: { color, fontSize, weight } }) => `
    color: ${color.bodyText};
    font-size: ${fontSize._21};
    line-height: 1.35;
    letter-spacing: 0.2px;
    font-weight: ${weight.medium};
  `,
);

export const H4 = styled.h4(
  ({ theme: { color, fontSize, weight } }) => `
    color: ${color.bodyText};
    font-size: ${fontSize._18};
    line-height: 1.4;
    letter-spacing: 0.15px;
    font-weight: ${weight.medium};
  `,
);

export const P1 = styled.p(
  ({ theme: { color, fontSize } }) => `
    color: ${color.bodyText};
    font-size: ${fontSize._16};
    line-height: 1.5;
    letter-spacing: 0.3px;
  `,
);

export const P2 = styled.p(
  ({ theme: { color, fontSize, weight } }) => `
    color: ${color.bodyText};
    font-size: ${fontSize._14};
    line-height: 1.5;
    letter-spacing: 0.25px;
    font-weight: ${weight.regular};
  `,
);

export const P3 = styled.p(
  ({ theme: { color, fontSize, weight } }) => `
    color: ${color.bodyTextSecondary};
    font-size: ${fontSize._12};
    line-height: 1.5;
    letter-spacing: 0.25px;
    font-weight: ${weight.regular};
    margin: 0;
  `,
);

export const Caption = styled.span(
  ({ theme: { color, fontSize, weight } }) => `
    color: ${color.bodyTextMuted};
    font-size: ${fontSize._12};
    line-height: 1.25;
    letter-spacing: 0.4px;
    font-weight: ${weight.regular};
  `,
);

export const Subtitle = styled.span(
  ({ theme: { color, fontSize, weight } }) => `
    color: ${color.bodyTextSecondary};
    font-size: ${fontSize._18};
    font-weight: ${weight.regular};
    line-height: 1.5;
    letter-spacing: 0.15px;
  `,
);

export const Mono = styled.span(
  ({ theme: { color, font, fontSize } }) => `
    color: ${color.bodyText};
    font-family: ${font.mono};
    font-size: ${fontSize._14};
    line-height: 1.5;
  `,
);
