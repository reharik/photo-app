import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import { contentNoun } from './contentNoun.js';
import { buttonStyle, paragraph } from './sharedStyles.js';

type Data = TemplateData['welcome'];

// Flat subject — no name interpolation, so it can never render a dangling
// comma or an empty slot. The name lives only in the H1.
export const subject = (): string => `Welcome to ${APP_NAME}`;

const Welcome = (data: Data): ReactElement => {
  // firstName can be empty/whitespace at signup; drop the name entirely rather
  // than greet an empty slot (no "Welcome, there").
  const name = data.firstName?.trim();
  const heading = name ? `Welcome, ${name}` : `Welcome to ${APP_NAME}`;

  return (
    <BaseEmail
      previewText={`Your ${APP_NAME} account is ready.`}
      title={heading}
      footerVariant="welcome"
    >
      <Section>
        <Text style={paragraph}>Your {APP_NAME} account is ready.</Text>
        <Text style={paragraph}>
          Put your {contentNoun()} somewhere they’ll stay — no feed, no strangers, no algorithm.
          Share an album with whoever you choose, and it opens for them on whatever they’re using.
        </Text>
      </Section>
      <Section style={{ marginTop: '24px' }}>
        <Button href={data.appUrl} style={buttonStyle}>
          Open {APP_NAME}
        </Button>
      </Section>
      <Section style={{ marginTop: '16px' }}>
        <Text style={paragraph}>
          Didn’t create this account? You can ignore this email — nothing else will happen.
        </Text>
      </Section>
    </BaseEmail>
  );
};

export default Welcome;
