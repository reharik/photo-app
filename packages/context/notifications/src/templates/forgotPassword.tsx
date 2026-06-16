import { Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';

type ForgotPasswordData = TemplateData['forgotPassword'];

export const subject = (): string => {
  return 'Your password reset code';
};

export const ForgotPassword = (data: ForgotPasswordData): ReactElement => {
  const appName = data.appName ?? 'PhotoApp';
  const greetingName = data.firstName?.trim() || 'there';

  return (
    <BaseEmail
      appName={appName}
      previewText={`Your ${appName} password reset code is ${data.code}.`}
      title={'Reset your password'}
    >
      <Section>
        <Text style={paragraph}>Hi {greetingName},</Text>
        <Text style={paragraph}>
          We received a request to reset your {appName} password. Enter the code below to continue:
        </Text>
      </Section>

      <Section style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Text style={codeStyle}>{data.code}</Text>
      </Section>

      <Section>
        <Text style={paragraph}>This code expires in 10 minutes.</Text>
        <Text style={muted}>
          If you didn&apos;t request a password reset, you can safely ignore this email — your
          password won&apos;t change.
        </Text>
      </Section>
    </BaseEmail>
  );
};

const paragraph = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const muted = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 6px',
};

const codeStyle = {
  color: '#18181b',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '8px',
  textAlign: 'center' as const,
  margin: 0,
};
