import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { ReactElement, ReactNode } from 'react';
import { APP_NAME } from './constants.js';
export type BaseEmailProps = {
  previewText: string;
  title: string;
  children: ReactNode;
};

export const BaseEmail = ({ previewText, title, children }: BaseEmailProps): ReactElement => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={brandStyle}>{APP_NAME}</Text>
          </Section>
          <Heading as="h1" style={headingStyle}>
            {title}
          </Heading>
          {children}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerMutedStyle}>
              You are receiving this email because of an account or activity on {APP_NAME}.
            </Text>
            <Text style={footerMutedStyle}>
              <Link href="#" style={footerLinkStyle}>
                Unsubscribe
              </Link>{' '}
              ·{' '}
              <Link href="#" style={footerLinkStyle}>
                Notification settings
              </Link>
            </Text>
            <Text style={footerFinePrintStyle}>
              This is an automated message; replies are not monitored.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const bodyStyle = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  margin: 0,
  padding: '24px 12px',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '32px 28px',
};

const headerStyle = {
  marginBottom: '24px',
};

const brandStyle = {
  color: '#18181b',
  fontSize: '15px',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  margin: 0,
};

const headingStyle = {
  color: '#18181b',
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: '1.3',
  margin: '0 0 16px',
};

const hrStyle = {
  borderColor: '#e4e4e7',
  margin: '28px 0',
};

const footerStyle = {
  marginTop: '8px',
};

const footerMutedStyle = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const footerLinkStyle = {
  color: '#52525b',
  textDecoration: 'underline',
};

const footerFinePrintStyle = {
  color: '#a1a1aa',
  fontSize: '11px',
  lineHeight: '1.5',
  margin: '12px 0 0',
};
