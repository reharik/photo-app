import { Button, Section, Text } from '@react-email/components';
import { ReactElement } from 'react';
import type { AlbumSection, CommentSection, ReactionItem, ReactionSection } from '../types.js';
import { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';

type ActivityDigestData = TemplateData['activityDigest'];
// { data: Map<ActivityKind, ActivitySection>; viewUrl: string }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const subject = (_data: ActivityDigestData): string => `New activity on ${APP_NAME}`;

const ActivityDigest = (data: ActivityDigestData): ReactElement => (
  <BaseEmail previewText={`There's new activity on ${APP_NAME}.`} title={'New activity'}>
    {[...data.data].map(([kind, section]) =>
      kind.match({
        album: () => <AlbumSectionView key={kind.key} data={section as AlbumSection} />,
        comment: () => <CommentSectionView key={kind.key} data={section as CommentSection} />,
        reaction: () => <ReactionSectionView key={kind.key} data={section as ReactionSection} />,
      }),
    )}

    <Section style={{ marginTop: '24px' }}>
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

const AlbumSectionView = ({ data }: { data: AlbumSection }): ReactElement => {
  const count = data.albumTitles.length;
  return (
    <Section>
      <Text style={paragraph}>
        There{count === 1 ? ' is' : ' are'} new photos in {count === 1 ? 'an album' : 'albums'}{' '}
        shared with you on {APP_NAME}:
      </Text>
      {data.albumTitles.map((title, i) => (
        <Text key={i} style={albumItem}>
          <strong>{title}</strong>
        </Text>
      ))}
    </Section>
  );
};

const CommentSectionView = ({ data }: { data: CommentSection }): ReactElement => (
  <Section>
    <Text style={paragraph}>New comments on your content:</Text>
    {data.map((item) =>
      item.comments.map((c, i) => (
        <Text key={`${item.mediaItemId}-${i}`} style={albumItem}>
          <strong>{c.commenterName}</strong>: {c.snippet}
        </Text>
      )),
    )}
  </Section>
);

const ReactionSectionView = ({ data }: { data: ReactionSection }): ReactElement => (
  <Section>
    <Text style={paragraph}>New reactions to your content:</Text>
    {data.map((group) => {
      const target = group.reactions[0]?.reactionTargetType;
      return (
        <Text key={group.targetId} style={albumItem}>
          {formatReactors(group.reactions)} reacted to your{' '}
          {target ? target.display.toLowerCase() : 'content'}
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

// ── styles (unchanged from AlbumActivity) ─────────────────

const paragraph = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const albumItem = {
  color: '#18181b',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 6px',
};

const muted = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 6px',
};

const linkFallback = {
  color: '#52525b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: 0,
  wordBreak: 'break-all' as const,
};

const buttonStyle = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#fafafa',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 20px',
  textDecoration: 'none',
};

export default ActivityDigest;
