import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { contentNoun } from './contentNoun.js';
import { buttonStyle, linkFallback, muted, paragraph } from './sharedStyles.js';

type Data = TemplateData['memberItemsShared'];

// Deliberately non-specific: inviteUrl lands on the "Shared with me" collection
// with no id, so the copy promises no particular destination. resourceName is
// NOT referenced — the strategy passes '' for it (known bug, separate ticket).
const sender = (data: Data): string => data.inviterName?.trim() || 'Someone';

export const subject = (data: Data): string => `${sender(data)} shared ${contentNoun()} with you`;

const MemberItemsShared = (data: Data): ReactElement => {
  const heading = `${sender(data)} shared ${contentNoun()} with you`;

  return (
    <BaseEmail previewText={heading} title={heading} footerVariant="notification">
      <Section>
        <Text style={paragraph}>They’re in your Shared with me.</Text>
      </Section>
      <Section style={{ marginTop: '24px' }}>
        <Button href={data.inviteUrl} style={buttonStyle}>
          View {contentNoun()}
        </Button>
      </Section>
      <Section style={{ marginTop: '16px' }}>
        <Text style={muted}>If the button doesn’t work, paste this link into your browser:</Text>
        <Text style={linkFallback}>{data.inviteUrl}</Text>
      </Section>
    </BaseEmail>
  );
};

export default MemberItemsShared;
