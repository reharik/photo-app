import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';
import { APP_NAME } from '.';
import { TemplateData } from '../types';

export type WelcomeEmailProps = {
  firstName?: string;
  appUrl: string;
};

type WelcomeData = TemplateData['welcome'];

export const subject = (data: WelcomeData): string => {
  return `Welcome to ${APP_NAME}, ${data.firstName} ${data.lastName}`;
};

export const WelcomeEmail = ({ firstName, appUrl }: WelcomeData) => {
  const greetingName = firstName?.trim() || 'there';

  return (
    <Html>
      <Head />
      <Preview>
        Your {APP_NAME} account is ready — your photos, shared with the people you choose.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brand}>{APP_NAME}</Text>
          </Section>

          <Heading style={heading}>Welcome, {greetingName}!</Heading>

          <Text style={paragraph}>Your {APP_NAME} account is ready.</Text>

          <Text style={paragraph}>
            {APP_NAME} is a private place for your photos — keep them in one spot, and share the
            moments you want with the family and friends you choose. Add your own, and see what
            everyone else adds.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={appUrl}>
              Open {APP_NAME}
            </Button>
          </Section>

          <Text style={paragraph}>
            Didn&apos;t create this account? You can safely ignore this email — nothing else will
            happen.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            You&apos;re receiving this because someone created a {APP_NAME} account with this email
            address.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  firstName: 'Jane',
  appUrl: 'https://photos.backintouch.net',
} satisfies WelcomeEmailProps;

export default WelcomeEmail;

// ---- styles ----

const body: React.CSSProperties = {
  backgroundColor: '#f5f3ee',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: '32px 0',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  margin: '0 auto',
  padding: '40px',
  maxWidth: '480px',
};

const brandSection: React.CSSProperties = {
  marginBottom: '24px',
};

const brand: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#6b4a2b',
  margin: 0,
};

const heading: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#2b2b2b',
  margin: '0 0 16px',
};

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#3a3a3a',
  margin: '0 0 16px',
};

const buttonSection: React.CSSProperties = {
  margin: '28px 0',
};

const button: React.CSSProperties = {
  backgroundColor: '#6b4a2b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 28px',
};

const hr: React.CSSProperties = {
  borderColor: '#e8e4dc',
  margin: '32px 0 16px',
};

const footer: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#8a8a8a',
  margin: 0,
};
