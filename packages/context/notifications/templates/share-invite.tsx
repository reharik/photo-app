import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';

type ShareInviteData = TemplateData['share-invite'];

export const subject = (data: ShareInviteData): string => {
  return `${data.inviterName} shared “${data.resourceName}” with you`;
};

const ShareInvite = (data: ShareInviteData): ReactElement => {
  const appName = data.appName ?? 'PhotoApp';
  return (
    <BaseEmail
      appName={appName}
      previewText={`${data.inviterName} invited you to ${data.resourceName}.`}
      title={'You have been invited'}
    >
      <Section>
        <Text style={paragraph}>
          <strong>{data.inviterName}</strong> shared <strong>{data.resourceName}</strong> with you
          on {appName}. Open the link below to view the album and add your own photos.
        </Text>
        <Text style={paragraph}>
          This link is unique to you; do not forward it if the content is private.
        </Text>
      </Section>
      <Section style={{ marginTop: '24px' }}>
        <Button href={data.inviteUrl} style={buttonStyle}>
          View shared album
        </Button>
      </Section>
      <Section style={{ marginTop: '16px' }}>
        <Text style={muted}>
          If the button does not work, copy and paste this URL into your browser:
        </Text>
        <Text style={linkFallback}>{data.inviteUrl}</Text>
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

const linkFallback = {
  color: '#52525b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: 0,
  wordBreak: 'break-all' as const,
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

export default ShareInvite;
