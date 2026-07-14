// Static mock for `@react-email/components`, wired via moduleNameMapper. The real
// barrel pulls in tailwindcss (whose ESM entry lacks the `compile` export under
// Jest's VM modules) and crashes render; per-file `unstable_mockModule` for it was
// unreliable once another suite loaded the real module into the worker (RAI-76).
//
// `render` serializes the element's props so assertions like
// `expect(html).toContain('Jane')` keep working without a real template engine.
const Passthrough = ({ children }) => children ?? null;

export const Html = Passthrough;
export const Head = Passthrough;
export const Body = Passthrough;
export const Container = Passthrough;
export const Section = Passthrough;
export const Text = Passthrough;
export const Button = Passthrough;
export const Heading = Passthrough;
export const Hr = Passthrough;
export const Link = Passthrough;
export const Preview = Passthrough;

export const render = async (element) => {
  const props = element && element.props ? element.props : {};
  return `<html><body>${JSON.stringify(props)}</body></html>`;
};

export default {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Hr,
  Link,
  Preview,
  render,
};
