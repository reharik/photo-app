import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { ReactElement, ReactNode } from 'react';
import { APP_NAME } from './constants.js';
import { EmailMarker } from './emailMarker.js';
import {
  bodyStyle,
  cardStyle,
  emailColors,
  footerCopy,
  footerTextStyle,
  FooterVariant,
  h1Style,
  hrStyle,
  outerBgStyle,
  wordmarkStyle,
} from './emailTokens.js';

export type BaseEmailProps = {
  previewText: string;
  title: string;
  footerVariant: FooterVariant;
  // Hidden machine-readable identity tokens (see emailMarker.tsx). Optional so a
  // template can opt out, but every template should pass at least its email-kind.
  markers?: string[];
  children: ReactNode;
};

export const BaseEmail = ({
  previewText,
  title,
  footerVariant,
  markers,
  children,
}: BaseEmailProps): ReactElement => {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{previewText}</Preview>
      {markers && markers.length > 0 && <EmailMarker tokens={markers} />}
      <Body style={bodyStyle}>
        {/* Outlook honors bgcolor on a table, not backgroundColor on a div. */}
        <Section bgcolor={emailColors.outerBg} style={outerBgStyle}>
          <Container style={cardStyle}>
            <Section style={headerStyle}>
              <Text style={wordmarkStyle}>{APP_NAME}</Text>
            </Section>
            <Heading as="h1" style={h1Style}>
              {title}
            </Heading>
            {children}
            <Hr style={hrStyle} />
            <Section style={footerStyle}>
              <Text style={footerTextStyle}>{footerCopy[footerVariant]}</Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
};

const headerStyle = {
  marginBottom: '24px',
};

const footerStyle = {
  marginTop: '8px',
};
