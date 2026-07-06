import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import { buttonStyle, linkFallback, muted, paragraph } from './sharedStyles.js';

type Data = TemplateData['itemShareInvite'];

export const subject = (data: Data): string =>
  `${data.inviterName} added photos to “${data.resourceName}”`;

const ItemShareInvite = (data: Data): ReactElement => (
  <BaseEmail
    previewText={`${data.inviterName} added new photos to ${data.resourceName}.`}
    title="New photos to see"
  >
    <Section>
      <Text style={paragraph}>
        <strong>{data.inviterName}</strong> added new photos to <strong>{data.resourceName}</strong>{' '}
        on {APP_NAME}. Take a look below.
      </Text>
    </Section>
    <Section style={{ marginTop: '24px' }}>
      <Button href={data.inviteUrl} style={buttonStyle}>
        View photos
      </Button>
    </Section>
    <Section style={{ marginTop: '16px' }}>
      <Text style={muted}>If the button doesn’t work, paste this link into your browser:</Text>
      <Text style={linkFallback}>{data.inviteUrl}</Text>
    </Section>
  </BaseEmail>
);

export default ItemShareInvite;
