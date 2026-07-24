import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import { emailKindMarker } from './emailMarker.js';
import { fontStacks } from './emailTokens.js';

void React;

type VerificationCodeData = TemplateData['verificationCode'];

export const subject = (): string => {
  return `Your ${APP_NAME} verification code`;
};

const VerificationCode = (data: VerificationCodeData): ReactElement => {
  return (
    <BaseEmail
      previewText={`Your ${APP_NAME} verification code is ${data.code}.`}
      title={'Your verification code'}
      footerVariant="transactional"
      markers={[emailKindMarker('verificationCode')]}
    >
      <Section>
        <Text style={paragraph}>Enter this code to continue:</Text>
      </Section>
      <Section style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Text style={codeStyle}>{data.code}</Text>
      </Section>
      <Section>
        <Text style={paragraph}>This code works for the next 10 minutes.</Text>
        <Text style={muted}>If you didn&apos;t ask for it, you can ignore this email.</Text>
      </Section>
    </BaseEmail>
  );
};

export default VerificationCode;

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
  fontFamily: fontStacks.mono,
  fontSize: '32px',
  fontWeight: 500,
  letterSpacing: '8px',
  textAlign: 'center' as const,
  margin: 0,
};
