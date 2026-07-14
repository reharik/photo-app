import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';

void React;

type EmailVerificationData = TemplateData['emailVerification'];

export const subject = (): string => {
  return `Your ${APP_NAME} verification code`;
};

const EmailVerification = (data: EmailVerificationData): ReactElement => {
  return (
    <BaseEmail
      previewText={`Your ${APP_NAME} verification code is ${data.code}.`}
      title={'Your verification code'}
    >
      <Section>
        <Text style={paragraph}>Enter this code to continue:</Text>
      </Section>
      <Section style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Text style={codeStyle}>{data.code}</Text>
      </Section>
      <Section>
        <Text style={paragraph}>This code expires in 10 minutes.</Text>
        <Text style={muted}>
          If you didn&apos;t request this, you can safely ignore this email.
        </Text>
      </Section>
    </BaseEmail>
  );
};

export default EmailVerification;

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
