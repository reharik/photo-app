import { AsyncNotificationKind, BatchedPayloadKind, EntityType } from '@packages/contracts';
import { Hr, Link, Section, Text } from '@react-email/components';
import { Fragment, ReactElement } from 'react';
import type {
  AlbumSection,
  CommentSection,
  ReactionItem,
  ReactionSection,
  TemplateData,
} from '../types.js';
import { BaseEmail } from './base.js';
import { APP_NAME } from './constants.js';
import { contentNoun } from './contentNoun.js';
import { emailKindMarker, sectionMarker } from './emailMarker.js';
import {
  bodyTextStyle,
  emailColors,
  fontStacks,
  hrStyle,
  secondaryTextStyle as muted,
} from './emailTokens.js';

type ActivityDigestData = TemplateData['activityDigest'];

// Word-boundary truncate to ~80 code points with a trailing ellipsis. Operates
// on code POINTS so it never splits a surrogate pair (emoji, astral chars).
const clip = (raw: string, max = 80): string => {
  const s = raw.trim();
  if ([...s].length <= max) return s;
  const clipped = [...s].slice(0, max).join('');
  const lastSpace = clipped.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped) + '…';
};

const person = (name: string | undefined): string => name?.trim() || 'Someone';

// One tappable line. A missing id → plain unlinked text (a true line with no
// link beats a link that 404s). Rows get real vertical padding to be a phone
// touch target.
const Row = ({ href, text }: { href?: string; text: string }): ReactElement =>
  href ? (
    <Link href={href} style={rowLink}>
      {text}
    </Link>
  ) : (
    <Text style={rowText}>{text}</Text>
  );

// ── subject ───────────────────────────────────────────────
// Name the digest only when it's about a single thing: exactly one driver kind
// (album XOR comment — reactions never drive) AND a single subject inside it.
// Everything else → generic. Never "{Person} and N others".
export const subject = ({ data }: ActivityDigestData): string => {
  const generic = `New activity on ${APP_NAME}`;
  const albums = data.get(BatchedPayloadKind.album) as AlbumSection | undefined;
  const comments = data.get(BatchedPayloadKind.comment) as CommentSection | undefined;

  const hasAlbum = Boolean(albums?.length);
  const commentRows = (comments ?? []).flatMap((i) => i.comments.filter((c) => c.snippet.trim()));
  const hasComment = commentRows.length > 0;

  if (hasAlbum === hasComment) return generic; // zero drivers, or both → generic

  if (hasAlbum) {
    if (albums!.length !== 1) return generic; // multiple albums → generic
    const name = albums![0].albumTitle?.trim();
    return name ? `New ${contentNoun()} in “${name}”` : `New ${contentNoun()} in an album`;
  }

  if (commentRows.length !== 1) return generic; // multiple comments / actors → generic
  const c = commentRows[0];
  return AsyncNotificationKind.replyPosted.equals(c.kind)
    ? `${person(c.commenterName)} replied to your comment`
    : `${person(c.commenterName)} commented on your ${contentNoun(1)}`;
};

// ── sections ──────────────────────────────────────────────
// Each returns null when it has nothing to show, so the parent can skip it
// (and its divider) rather than render an empty label.

const renderAlbums = (rows: AlbumSection, appUrl: string): ReactElement | null => {
  if (!rows.length) return null;
  return (
    <Section style={sectionBlock}>
      <Text style={sectionLabel}>New {contentNoun()}</Text>
      {rows.map((a, i) => {
        const name = a.albumTitle?.trim();
        const text = name
          ? `New ${contentNoun()} in “${name}”`
          : `New ${contentNoun()} in an album`;
        const href = a.albumId ? `${appUrl}/albums/${a.albumId}` : undefined;
        return <Row key={i} href={href} text={text} />;
      })}
    </Section>
  );
};

const renderComments = (items: CommentSection, appUrl: string): ReactElement | null => {
  // one row per comment, flattening the by-media grouping; drop empty snippets
  const rows = items.flatMap((item) =>
    item.comments
      .filter((c) => c.snippet.trim().length > 0)
      .map((c) => ({ c, mediaItemId: item.mediaItemId })),
  );
  if (!rows.length) return null;
  return (
    <Section style={sectionBlock}>
      <Text style={sectionLabel}>Comments</Text>
      {rows.map(({ c, mediaItemId }, i) => {
        const lead = AsyncNotificationKind.replyPosted.equals(c.kind)
          ? `${person(c.commenterName)} replied to your comment`
          : `${person(c.commenterName)} commented on your ${contentNoun(1)}`;
        const href = mediaItemId ? `${appUrl}/media/${mediaItemId}` : undefined;
        return (
          <Row key={`${mediaItemId}-${i}`} href={href} text={`${lead} — “${clip(c.snippet)}”`} />
        );
      })}
    </Section>
  );
};

const renderReactions = (groups: ReactionSection, appUrl: string): ReactElement | null => {
  // Reactions ride along last. One row per target, collapsed to a single
  // reactor (the queue only ever keeps one) — never "and N others".
  const rows = groups
    .map((g) => ({ r: g.reactions[0], mediaId: g.mediaId }))
    .filter((x): x is { r: ReactionItem; mediaId: string } => Boolean(x.r));
  if (!rows.length) return null;
  return (
    <Section style={sectionBlock}>
      <Text style={sectionLabel}>Also</Text>
      {rows.map(({ r, mediaId }, i) => {
        const target = EntityType.comment.equals(r.reactionTargetType) ? 'comment' : contentNoun(1);
        const href = mediaId ? `${appUrl}/media/${mediaId}` : undefined;
        return <Row key={i} href={href} text={`${person(r.reactorName)} liked your ${target}`} />;
      })}
    </Section>
  );
};

const ActivityDigest = ({ data, appUrl }: ActivityDigestData): ReactElement => {
  // Fixed order: new photos, then comments, then reactions (always last).
  const albums = data.get(BatchedPayloadKind.album) as AlbumSection | undefined;
  const comments = data.get(BatchedPayloadKind.comment) as CommentSection | undefined;
  const reactions = data.get(BatchedPayloadKind.reaction) as ReactionSection | undefined;

  const albumEl = albums && renderAlbums(albums, appUrl);
  const commentEl = comments && renderComments(comments, appUrl);
  const reactionEl = reactions && renderReactions(reactions, appUrl);

  const sections = [albumEl, commentEl, reactionEl].filter((el): el is ReactElement => Boolean(el));

  // Mark the sections that actually rendered (each renderer returns null when it
  // has nothing to show), so tests can key off which activity a digest carries.
  const markers = [
    emailKindMarker('activityDigest'),
    albumEl && sectionMarker('album'),
    commentEl && sectionMarker('comment'),
    reactionEl && sectionMarker('reaction'),
  ].filter((m): m is string => Boolean(m));

  return (
    <BaseEmail
      previewText={`There's new activity on ${APP_NAME}.`}
      title={"What's new"}
      footerVariant="notification"
      markers={markers}
    >
      <Text style={lede}>Here&apos;s what&apos;s happened recently.</Text>
      {sections.map((el, i) => (
        <Fragment key={i}>
          {i > 0 && <Hr style={divider} />}
          {el}
        </Fragment>
      ))}
    </BaseEmail>
  );
};

export default ActivityDigest;

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
  margin: '0 0 6px',
};

const rowLink = {
  ...bodyTextStyle,
  color: emailColors.accent,
  fontWeight: 500,
  textDecoration: 'none',
  display: 'block',
  padding: '10px 0',
  margin: 0,
};

const rowText = {
  ...bodyTextStyle,
  display: 'block',
  padding: '10px 0',
  margin: 0,
};

const divider = {
  ...hrStyle,
  margin: '24px 0',
};
