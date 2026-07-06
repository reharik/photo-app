import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import { buttonStyle, linkFallback, muted, paragraph } from './sharedStyles.js';

type Data = TemplateData['albumShareInvite'];

export const subject = (data: Data): string =>
  `${data.inviterName} shared “${data.resourceName}” with you`;

const AlbumShareInvite = (data: Data): ReactElement => (
  <BaseEmail
    previewText={`${data.inviterName} invited you to ${data.resourceName}.`}
    title="You’ve been invited"
  >
    <Section>
      <Text style={paragraph}>
        <strong>{data.inviterName}</strong> shared <strong>{data.resourceName}</strong> with you on{' '}
        {APP_NAME}. Open it below to see the photos.
      </Text>
    </Section>
    <Section style={{ marginTop: '24px' }}>
      <Button href={data.inviteUrl} style={buttonStyle}>
        View album
      </Button>
    </Section>
    <Section style={{ marginTop: '16px' }}>
      <Text style={muted}>If the button doesn’t work, paste this link into your browser:</Text>
      <Text style={linkFallback}>{data.inviteUrl}</Text>
    </Section>
  </BaseEmail>
);

export default AlbumShareInvite;
