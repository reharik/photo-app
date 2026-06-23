import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';

type PublicShareData = TemplateData['publicShare'];

export const subject = (data: PublicShareData): string => {
  return `${data.inviterName} shared “${data.resourceName}” with you`;
};

const PublicShare = (data: PublicShareData): ReactElement => {
  return (
    <BaseEmail
      previewText={`${data.inviterName} shared ${data.resourceName} with you — no account needed to look.`}
      title={'A photo album was shared with you'}
    >
      <Section>
        <Text style={paragraph}>
          <strong>{data.inviterName}</strong> shared <strong>{data.resourceName}</strong> with you
          on {APP_NAME}. You can open the whole album right now — no account, no app, nothing to
          install.
        </Text>
      </Section>

      <Section style={{ marginTop: '24px' }}>
        <Button href={data.inviteUrl} style={primaryButton}>
          View album
        </Button>
      </Section>

      <Section style={{ marginTop: '32px', borderTop: '1px solid #e4e4e7', paddingTop: '24px' }}>
        <Text style={paragraph}>
          Want to keep it? Create a free {APP_NAME} account and this album lands in your shared
          albums — yours to revisit anytime, and you’ll know the moment {data.inviterName} adds new
          photos. You can start sharing your own, too.
        </Text>
        <Button href={data.signupUrl} style={secondaryButton}>
          Sign up free
        </Button>
      </Section>

      <Section style={{ marginTop: '32px' }}>
        <Text style={muted}>If the button doesn’t work, paste this link into your browser:</Text>
        <Text style={linkFallback}>{data.inviteUrl}</Text>
      </Section>
    </BaseEmail>
  );
};

const paragraph = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
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
const primaryButton = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#fafafa',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '14px 28px',
  textDecoration: 'none',
};
const secondaryButton = {
  backgroundColor: '#ffffff',
  border: '1px solid #d4d4d8',
  borderRadius: '6px',
  color: '#18181b',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '11px 22px',
  textDecoration: 'none',
};

export default PublicShare;
