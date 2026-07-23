import { Button, Hr, Section, Text } from '@react-email/components';
import { Fragment, ReactElement } from 'react';
import type { AlbumSection, CommentSection, ReactionItem, ReactionSection } from '../types.js';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import {
  bodyTextStyle,
  buttonStyle,
  fontStacks,
  hrStyle,
  linkFallbackStyle as linkFallback,
  secondaryTextStyle as muted,
} from './emailTokens.js';

type ActivityDigestData = TemplateData['activityDigest'];
// { data: Map<ActivityKind, ActivitySection>; viewUrl: string }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const subject = (_data: ActivityDigestData): string => `New activity on ${APP_NAME}`;

const ActivityDigest = (data: ActivityDigestData): ReactElement => (
  <BaseEmail
    previewText={`There's new activity on ${APP_NAME}.`}
    title={'New activity'}
    footerVariant="notification"
  >
    <Text style={lede}>Here's what's new since you were last here.</Text>

    {[...data.data].map(([kind, section], i) => (
      <Fragment key={kind.key}>
        {i > 0 && <Hr style={divider} />}
        {kind.match({
          album: () => <AlbumSectionView data={section as AlbumSection} />,
          comment: () => <CommentSectionView data={section as CommentSection} />,
          reaction: () => <ReactionSectionView data={section as ReactionSection} />,
        })}
      </Fragment>
    ))}

    <Section style={{ marginTop: '28px' }}>
      <Button href={data.viewUrl} style={buttonStyle}>
        View activity
      </Button>
    </Section>

    <Section style={{ marginTop: '16px' }}>
      <Text style={muted}>If the button doesn't work, paste this link into your browser:</Text>
      <Text style={linkFallback}>{data.viewUrl}</Text>
    </Section>
  </BaseEmail>
);

// ── sections ──────────────────────────────────────────────
// Each section shares one shape: a small label, then items that
// lead with a bolded anchor (album / commenter / reactors).

const AlbumSectionView = ({ data }: { data: AlbumSection }): ReactElement => (
  <Section style={sectionBlock}>
    <Text style={sectionLabel}>New photos</Text>
    {data.albumTitles.map((title, i) => (
      <Text key={i} style={item}>
        <strong>{title}</strong>
      </Text>
    ))}
  </Section>
);

const CommentSectionView = ({ data }: { data: CommentSection }): ReactElement => (
  <Section style={sectionBlock}>
    <Text style={sectionLabel}>New comments</Text>
    {data.map((entry) =>
      entry.comments.map((c, i) => (
        <Text key={`${entry.mediaItemId}-${i}`} style={item}>
          <strong>{c.commenterName}</strong> &mdash; {c.snippet}
        </Text>
      )),
    )}
  </Section>
);

const ReactionSectionView = ({ data }: { data: ReactionSection }): ReactElement => (
  <Section style={sectionBlock}>
    <Text style={sectionLabel}>New reactions</Text>
    {data.map((group) => {
      const target = group.reactions[0]?.reactionTargetType;
      return (
        <Text key={group.containerId} style={item}>
          <strong>{formatReactors(group.reactions)}</strong> reacted to your{' '}
          {target ? target.display.toLowerCase() : 'photo'}
        </Text>
      );
    })}
  </Section>
);

const formatReactors = (reactions: ReactionItem[]): string => {
  const names = reactions.map((r) => r.reactorName).filter(Boolean);
  if (names.length === 0) return 'Someone';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]} and ${names.length - 1} others`;
};

// ── styles ────────────────────────────────────────────────

const lede = {
  ...bodyTextStyle,
  margin: '0 0 24px',
};

const sectionBlock = {
  margin: 0,
};

const sectionLabel = {
  ...muted,
  fontFamily: fontStacks.serif,
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  margin: '0 0 10px',
};

const item = {
  ...bodyTextStyle,
  margin: '0 0 6px',
};

const divider = {
  ...hrStyle,
  margin: '24px 0',
};

export default ActivityDigest;
