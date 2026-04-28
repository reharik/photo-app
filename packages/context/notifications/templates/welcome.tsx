import { Button, Section, Text } from '@react-email/components';
import type { FC } from 'react';
import type { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';

type WelcomeData = TemplateData['welcome'];

export const subject = (data: WelcomeData): string => {
  const app = data.appName ?? 'PhotoApp';
  return `Welcome to ${app}, ${data.userName}`;
};

const Welcome: FC<WelcomeData> = (data) => {
  const appName = data.appName ?? 'PhotoApp';
  return (
    <BaseEmail
      appName={appName}
      previewText={`Your ${appName} account is ready.`}
      title={`Welcome, ${data.userName}`}
    >
      <Section>
        <Text style={paragraph}>
          Thanks for joining {appName}. You can upload photos, organize albums, and invite others
          when you are ready.
        </Text>
        <Text style={paragraph}>
          If you did not create this account, you can safely ignore this email.
        </Text>
      </Section>
      <Section style={{ marginTop: '24px' }}>
        <Button href={data.gettingStartedUrl} style={buttonStyle}>
          Open your dashboard
        </Button>
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

const buttonStyle = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#fafafa',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 20px',
  textDecoration: 'none',
};

export default Welcome;
