import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';

type AlbumActivityData = TemplateData['albumActivity'];

export const subject = (data: AlbumActivityData): string => {
  const count = data.albumTitles.length;
  return count === 1
    ? `New activity in “${data.albumTitles[0]}”`
    : `New activity in ${count} of your shared albums`;
};

const AlbumActivity = (data: AlbumActivityData): ReactElement => {
  const count = data.albumTitles.length;
  return (
    <BaseEmail
      previewText={`There's new activity in your shared albums on ${APP_NAME}.`}
      title={'New album activity'}
    >
      <Section>
        <Text style={paragraph}>
          There{count === 1 ? ' is' : ' are'} new photos in {count === 1 ? 'an album' : 'albums'}{' '}
          shared with you on {APP_NAME}:
        </Text>
      </Section>

      <Section>
        {data.albumTitles.map((title, i) => (
          <Text key={i} style={albumItem}>
            <strong>{title}</strong>
          </Text>
        ))}
      </Section>

      <Section style={{ marginTop: '24px' }}>
        <Button href={data.viewUrl} style={buttonStyle}>
          View {count === 1 ? 'album' : 'albums'}
        </Button>
      </Section>

      <Section style={{ marginTop: '16px' }}>
        <Text style={muted}>If the button doesn’t work, paste this link into your browser:</Text>
        <Text style={linkFallback}>{data.viewUrl}</Text>
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

const albumItem = {
  color: '#18181b',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 6px',
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

export default AlbumActivity;
