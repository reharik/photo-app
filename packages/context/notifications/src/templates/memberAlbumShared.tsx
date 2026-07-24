import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { contentCount } from './contentNoun.js';
import { buttonStyle, linkFallback, muted, paragraph } from './sharedStyles.js';

type Data = TemplateData['memberAlbumShared'];

// Sender never renders blank; album name is dropped along with its quotes and
// preposition when absent (never a dangling `""`).
const sender = (data: Data): string => data.inviterName?.trim() || 'Someone';
const album = (data: Data): string => data.resourceName?.trim() || '';

export const subject = (data: Data): string => {
  const who = sender(data);
  const name = album(data);
  return name ? `${who} shared “${name}” with you` : `${who} shared an album with you`;
};

const MemberAlbumShared = (data: Data): ReactElement => {
  const who = sender(data);
  const name = album(data);
  const count = contentCount({ photos: data.itemCount });
  const body = name
    ? `${who} added you to “${name}” — ${count}.`
    : `${who} added you to an album — ${count}.`;

  return (
    <BaseEmail
      previewText={body}
      title={`${who} shared an album with you`}
      footerVariant="notification"
    >
      <Section>
        <Text style={paragraph}>{body}</Text>
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

export default MemberAlbumShared;
