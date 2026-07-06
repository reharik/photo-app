import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import { buttonStyle, linkFallback, muted, paragraph } from './sharedStyles.js';

type Data = TemplateData['albumGuestInvite'];

export const subject = (data: Data): string =>
  `${data.inviterName} shared “${data.resourceName}” with you`;

const AlbumGuestInvite = (data: Data): ReactElement => (
  <BaseEmail
    previewText={`${data.inviterName} shared photos with you — no account needed.`}
    title="Someone shared photos with you"
  >
    <Section>
      <Text style={paragraph}>
        <strong>{data.inviterName}</strong> shared <strong>{data.resourceName}</strong> with you on{' '}
        {APP_NAME}. Just tap below to see the photos — <strong>no account or sign-up needed</strong>
        .
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

export default AlbumGuestInvite;
