import { createGlobalStyle, css } from 'styled-components';

/**
 * CSS Reset — normalizes browser defaults so they don't conflict with
 * the design system. Adapted from the Linus design system reset with
 * additions for modern dark-themed UIs.
 */
const resetCSS = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  div,
  span,
  object,
  iframe,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  blockquote,
  pre,
  a,
  abbr,
  address,
  code,
  del,
  dfn,
  em,
  img,
  q,
  dl,
  dt,
  dd,
  ol,
  ul,
  li,
  fieldset,
  form,
  label,
  legend,
  table,
  caption,
  tbody,
  tfoot,
  thead,
  tr,
  th,
  td,
  article,
  aside,
  dialog,
  figure,
  footer,
  header,
  hgroup,
  nav,
  section,
  input,
  select,
  textarea {
    margin: 0;
    padding: 0;
    border: 0;
    font-weight: inherit;
    font-style: inherit;
    font-size: 100%;
    font-family: inherit;
    vertical-align: baseline;
  }

  ul li {
    list-style-type: none;
  }

  article,
  aside,
  dialog,
  figure,
  footer,
  header,
  hgroup,
  nav,
  section {
    display: block;
  }

  body {
    line-height: 1.6;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  caption,
  th,
  td {
    text-align: left;
    font-weight: normal;
  }

  table,
  td,
  th {
    vertical-align: middle;
  }

  blockquote:before,
  blockquote:after,
  q:before,
  q:after {
    content: '';
  }

  blockquote,
  q {
    quotes: '' '';
  }

  a img {
    border: none;
  }
`;

/**
 * Typography and application-level styles that consume theme tokens.
 */
const typographyCSS = css(
  ({ theme: { color, font, weight, fontSize } }) => `
    :root {
      color-scheme: dark;
    }

    html, body, #root {
      height: 100%;
      width: 100%;
    }

    body,
    input,
    textarea,
    select,
    button,
    legend,
    p {
      color: ${color.bodyText};
      font-family: ${font.body};
      font-weight: ${weight.regular};
      font-size: ${fontSize._16};
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      background-color: ${color.body};
    }

    a {
      color: ${color.link};
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s ease;

      &:hover,
      &:focus {
        color: ${color.linkHover};
      }

      &:active {
        color: ${color.linkActive};
      }
    }

    button {
      cursor: pointer;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: ${weight.medium};
      line-height: 1.3;
      color: ${color.bodyText};
    }

    h1 { font-size: ${fontSize._32}; }
    h2 { font-size: ${fontSize._24}; }
    h3 { font-size: ${fontSize._21}; }
    h4 { font-size: ${fontSize._18}; }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    ::selection {
      background: ${color.selectionBg};
      color: ${color.selectionText};
    }

    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-track {
      background: ${color.scrollTrack};
    }

    ::-webkit-scrollbar-thumb {
      background: ${color.scrollThumb};
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: ${color.scrollThumbHover};
    }
  `,
);

export const GlobalStyle = createGlobalStyle`
  ${resetCSS}
  ${typographyCSS}
`;
