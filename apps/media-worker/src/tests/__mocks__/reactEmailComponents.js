// Jest mock for `@react-email/components`. Loading the real barrel pulls in
// `tailwindcss`, whose ESM entry does not provide the `compile` export under Jest's
// experimental VM modules and crashes any test that transitively imports a
// notification template (e.g. the worker container test, which composes the
// notifications manifest). The worker never renders emails, so passthrough
// components + a stub `render` are enough to let the module graph load.
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

export const render = async () => '<html></html>';

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
