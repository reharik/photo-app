import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './index.js';

type PublicShareData = TemplateData['publicShare'];

export const subject = (data: PublicShareData): string => {
  return `${data.inviterName} shared “${data.resourceName}” with you`;
};

const PublicShare = (data: PublicShareData): ReactElement => {
  return (
    <BaseEmail
      previewText={`${data.inviterName} shared ${data.resourceName} with you.`}
      title={'A photo album was shared with you'}
    >
      <Section>
        <Text style={paragraph}>
          <strong>{data.inviterName}</strong> shared <strong>{data.resourceName}</strong> with you
          on {APP_NAME}. No account needed — just open it below.
        </Text>
      </Section>
      <Section style={{ marginTop: '24px' }}>
        <Button href={data.publicUrl} style={buttonStyle}>
          View album
        </Button>
      </Section>
      <Section style={{ marginTop: '16px' }}>
        <Text style={muted}>If the button doesn’t work, paste this link into your browser:</Text>
        <Text style={linkFallback}>{data.publicUrl}</Text>
      </Section>
      <Section style={{ marginTop: '24px' }}>
        <Text style={muted}>
          Want to keep it? Sign up for {APP_NAME} and this album will be waiting in your shared
          albums — plus you can start your own.
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

export default PublicShare;
