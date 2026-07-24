import { Link, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME, SUPPORT_EMAIL } from './constants.js';
import { emailKindMarker } from './emailMarker.js';
import {
  linkStyle,
  secondaryTextStyle as muted,
  bodyTextStyle as paragraph,
} from './emailTokens.js';

type PasswordChangedData = TemplateData['passwordChanged'];

export const subject = (): string => `Your ${APP_NAME} password was changed`;

const PasswordChanged = (data: PasswordChangedData): ReactElement => {
  // timeZone: 'UTC' is required — without it the date formats in whatever zone
  // the server runs in and drifts with deployment. Date only: we don't know the
  // recipient's zone and a wrong hour is worse than no hour.
  const changedAt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(data.changedAt));

  return (
    <BaseEmail
      previewText={`Your ${APP_NAME} password was just changed.`}
      title={'Your password was changed'}
      footerVariant="transactional"
      markers={[emailKindMarker('passwordChanged')]}
    >
      <Section>
        <Text style={paragraph}>
          Your password was changed on {changedAt}. You can sign in with it now.
        </Text>
        <Text style={muted}>
          If this wasn&apos;t you, email{' '}
          <Link href={`mailto:${SUPPORT_EMAIL}`} style={linkStyle}>
            {SUPPORT_EMAIL}
          </Link>{' '}
          &mdash; someone else may have access to your account.
        </Text>
      </Section>
    </BaseEmail>
  );
};

export default PasswordChanged;
