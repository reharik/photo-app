import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import { contentCount, contentNoun } from './contentNoun.js';
import { emailKindMarker } from './emailMarker.js';
import { buttonStyle, linkFallback, muted, paragraph } from './sharedStyles.js';

type Data = TemplateData['guestAlbumShared'];

// This recipient has no account. The sender's name is the trust signal, so it
// falls back to inviterEmail — never "Someone" — before a last-resort default.
const sender = (data: Data): string =>
  data.inviterName?.trim() || data.inviterEmail?.trim() || 'Someone';
const album = (data: Data): string => data.resourceName?.trim() || '';

export const subject = (data: Data): string =>
  `${sender(data)} sent you ${contentNoun()} on ${APP_NAME}`;

const GuestAlbumShared = (data: Data): ReactElement => {
  const who = sender(data);
  const name = album(data);
  const heading = `${who} sent you ${contentCount({ photos: data.itemCount })}`;
  const intro = name
    ? `${who} shared “${name}” with you on ${APP_NAME}.`
    : `${who} shared an album with you on ${APP_NAME}.`;

  return (
    <BaseEmail
      previewText={intro}
      title={heading}
      footerVariant="shareLink"
      markers={[emailKindMarker('guestAlbumShared')]}
    >
      <Section>
        <Text style={paragraph}>{intro}</Text>
        <Text style={paragraph}>
          Tap below and the album opens. Nothing to install, and it works on whatever you’re reading
          this on.
        </Text>
      </Section>
      <Section style={{ marginTop: '24px' }}>
        <Button href={data.inviteUrl} style={buttonStyle}>
          Open the album
        </Button>
      </Section>
      <Section style={{ marginTop: '16px' }}>
        <Text style={muted}>If the button doesn’t work, paste this link into your browser:</Text>
        <Text style={linkFallback}>{data.inviteUrl}</Text>
      </Section>
    </BaseEmail>
  );
};

export default GuestAlbumShared;
