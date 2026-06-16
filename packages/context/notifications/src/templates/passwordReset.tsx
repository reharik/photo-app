import { Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';

type PasswordResetData = TemplateData['passwordReset'];

export const subject = (_data: PasswordResetData): string => {
  return 'Your password was changed';
};

const PasswordReset = (data: PasswordResetData): ReactElement => {
  const appName = data.appName ?? 'PhotoApp';
  const greetingName = data.firstName?.trim() || 'there';

  return (
    <BaseEmail
      appName={appName}
      previewText={`Your ${appName} password was just changed.`}
      title={'Your password was changed'}
    >
      <Section>
        <Text style={paragraph}>Hi {greetingName},</Text>
        <Text style={paragraph}>
          Your {appName} password was just changed. You can now sign in with your new password.
        </Text>
        <Text style={muted}>
          If you didn&apos;t make this change, your account may be at risk. Reset your password
          again right away, and consider checking that no one else has access to your email.
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

export default PasswordReset;
