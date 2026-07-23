import { Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import { secondaryTextStyle as muted, bodyTextStyle as paragraph } from './emailTokens.js';

type PasswordChangedData = TemplateData['passwordChanged'];

export const subject = (): string => {
  return 'Your password was changed';
};

const PasswordChanged = (data: PasswordChangedData): ReactElement => {
  const greetingName = data.firstName?.trim() || 'there';

  return (
    <BaseEmail
      previewText={`Your ${APP_NAME} password was just changed.`}
      title={'Your password was changed'}
      footerVariant="transactional"
    >
      <Section>
        <Text style={paragraph}>Hi {greetingName},</Text>
        <Text style={paragraph}>
          Your {APP_NAME} password was just changed. You can now sign in with your new password.
        </Text>
        <Text style={muted}>
          If you didn&apos;t make this change, your account may be at risk. Reset your password
          again right away, and consider checking that no one else has access to your email.
        </Text>
      </Section>
    </BaseEmail>
  );
};

export default PasswordChanged;
