import { MediaAssetKind } from '@packages/contracts';
import { Camera } from 'lucide-react';
import styled, { css } from 'styled-components';

import { contentCount } from '../../domain/formatters/contentNoun';
import { buildMediaItemUrl } from '../../domain/formatters/mediaItemUrlBuilder';
import { truncate } from '../../domain/formatters/truncate';
import { HeroIllustration } from '../../ui/HeroIllustration';
import { PublicAlbumSummaryVM } from '../../viewModels/';
import { PublicAlbumOffer } from './PublicAlbumOffer';

/**
 * Generous on desktop, tight on mobile. Both are well inside what the row can hold at its
 * breakpoint, so the CSS ellipsis underneath is a backstop for wide glyphs rather than the
 * usual case. See `truncate` for why both mechanisms are used.
 */
const TITLE_MAX_DESKTOP = 40;
const TITLE_MAX_MOBILE = 24;

type PublicAlbumHeaderProps = {
  album: PublicAlbumSummaryVM;
  count: number;
  /** '' when the owner has no resolvable name; every attribution line is then omitted. */
  ownerName: string;
  /** Scroll-collapsed. Ignored on mobile, which has no compact state (see below). */
  compact: boolean;
  isMobile: boolean;
};

/**
 * The public album header, in one block.
 *
 * This view owns its own header rather than driving the shared `AlbumSectionMetadata`: the
 * composition here is a split row with an offer on the trailing edge, and the collapsed
 * state is a bespoke single row — neither of which the authed component models. Routing it
 * through there would mean public-only branches inside a component the authed album view
 * depends on.
 *
 * Three states, not four. Mobile deliberately has NO compact variant (matching the previous
 * behavior): the brand row hides on scroll and the metadata row stays put, because the
 * mobile offer lives in a pinned bottom bar that is always visible anyway.
 *
 * The brand row now sits INSIDE the same opaque block as the metadata row. Previously it was
 * a transparent header floating above an opaque metadata band, which is what made the header
 * read as detached.
 */
export const PublicAlbumHeader = ({
  album,
  count,
  ownerName,
  compact,
  isMobile,
}: PublicAlbumHeaderProps) => {
  const isCompactRow = compact && !isMobile;
  const coverUrl = album.coverMedia
    ? buildMediaItemUrl(album.coverMedia.id, MediaAssetKind.thumbnail)
    : undefined;

  const cover = (size: CoverSize) => (
    <Cover $size={size}>
      {album.coverMedia ? (
        <CoverImage
          src={coverUrl}
          data-testid={`album-cover-${album.coverMedia.id}`}
          alt={album.coverMedia.kind.display ?? ''}
        />
      ) : (
        <CoverPlaceholder aria-hidden>
          <Camera size={size === 'full' ? 28 : 20} strokeWidth={1.75} aria-hidden />
        </CoverPlaceholder>
      )}
    </Cover>
  );

  // `title` attribute carries the untruncated title for anyone who needs the whole thing.
  const titleText = truncate(album.title, isMobile ? TITLE_MAX_MOBILE : TITLE_MAX_DESKTOP);

  if (isCompactRow) {
    return (
      <HeaderShell $compact>
        <Row>
          <Leading>
            {cover('compact')}
            <LeadingText>
              <CompactBrandLine>
                <CompactWordmark>Homeroll</CompactWordmark>
                <CompactLead>A living album</CompactLead>
              </CompactBrandLine>
              <CompactSubline>
                <span title={album.title}>{titleText}</span> · {contentCount(count)}
              </CompactSubline>
            </LeadingText>
          </Leading>
          <Trailing>
            <PublicAlbumOffer albumId={album.id} ownerName={ownerName} variant="compact" />
          </Trailing>
        </Row>
      </HeaderShell>
    );
  }

  return (
    <HeaderShell $compact={false}>
      {!compact ? (
        <BrandRow>
          <HeroIllustration size={60} /> <Wordmark>Homeroll</Wordmark>
          <Slogan>A private album, shared with you.</Slogan>
        </BrandRow>
      ) : null}
      <Row $topAlign={!isMobile}>
        <Leading $topAlign={!isMobile}>
          {cover(isMobile ? 'compact' : 'full')}
          <LeadingText>
            <Title $mobile={isMobile} title={album.title}>
              {titleText}
            </Title>
            <Count>{contentCount(count)}</Count>
            {/* Desktop puts the attribution in the offer block on the trailing edge; on
                mobile there is no header offer, so it belongs here instead. */}
            {isMobile && ownerName !== '' ? (
              <MobileAttribution>shared with you by {ownerName}</MobileAttribution>
            ) : null}
          </LeadingText>
        </Leading>
        {!isMobile ? (
          <Trailing>
            <PublicAlbumOffer albumId={album.id} ownerName={ownerName} variant="full" />
          </Trailing>
        ) : null}
      </Row>
    </HeaderShell>
  );
};

type CoverSize = 'full' | 'compact';

const HeaderShell = styled.header<{ $compact: boolean }>`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme, $compact }) =>
    $compact
      ? `${theme.spacing(1.5)} ${theme.spacing(6)}`
      : `${theme.spacing(2)} ${theme.spacing(6)} ${theme.spacing(1.5)}`};
  background: ${({ theme }) => theme.color.body};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  box-sizing: border-box;
  transition:
    gap 180ms ease,
    padding 180ms ease;

  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing(1.5)};
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  }
`;

const BrandRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  text-align: center;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(0.5)};
  width: 100%;
  /* Hairline separating the brand row from the metadata row. Subtle (borderSubtle) on
     purpose: the stronger border token is reserved for HeaderShell's outer bottom edge, so
     the two rows read as divisions WITHIN one block rather than as two stacked blocks. */
  padding-bottom: ${({ theme }) => theme.spacing(1.75)};
  border-bottom: 1px solid ${({ theme }) => theme.color.borderSubtle};

  /* Desktop-only: mobile's header composition is unchanged. */
  @media (max-width: 768px) {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

//  Mirrors the app-shell wordmark treatment (serif / regular / -0.02em), scaled up to be the
// largest text on the screen since it's the only branding here. Non-interactive: a public
// recipient has no app home to link to.
const Wordmark = styled.span`
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._32};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.02em;
  line-height: 1.2;

  @media (max-width: 375px) {
    font-size: ${({ theme }) => theme.fontSize._24};
  }
`;

// Clay (textAccent) — a warm color anchor against the cream body so the header doesn't read
// sterile. clay-on-body is a legible foreground tint at this size.
const Slogan = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.textAccent};
  line-height: 1.4;
`;

// space-between across the FULL width — this is the fix for the floating header. The
// metadata used to hug left as a content-width cluster with nothing on the trailing edge.
// $topAlign is the DESKTOP FULL header only (passed as !isMobile from that branch). The
// compact row leaves it unset and keeps center alignment.
const Row = styled.div<{ $topAlign?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: ${({ $topAlign }) => ($topAlign ? 'flex-start' : 'center')};
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(3)};
  width: 100%;
  min-width: 0;
`;

// Top-aligning Row alone is not enough: this centers the title/count block against the
// cover, so the offer would land level with the cover's TOP EDGE rather than with the title.
// Both have to top-align for the two columns to start on the same line.
const Leading = styled.div<{ $topAlign?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: ${({ $topAlign }) => ($topAlign ? 'flex-start' : 'center')};
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 0;
`;

const LeadingText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  min-width: 0;
  justify-content: center;
`;

const Trailing = styled.div`
  display: flex;
  flex-shrink: 0;
  min-width: 0;
`;

// Print treatment: warm matte + warm drop shadow + inner-edge inset ring so the header cover
// reads as a framed print. `overflow: hidden` clips the image to the matte inner edge but
// not the element's own outer drop shadow, so the warm shadow still shows.
const Cover = styled.div<{ $size: CoverSize }>`
  flex-shrink: 0;
  background: ${({ theme }) => theme.color.print};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow:
    ${({ theme }) => theme.boxShadow.print},
    inset 0 0 0 1px ${({ theme }) => theme.color.borderSubtle};

  ${({ $size, theme }) =>
    $size === 'full'
      ? css`
          width: 180px;
          aspect-ratio: 4 / 3;
          padding: ${theme.spacing(0.75)};
          border-radius: ${theme.borderRadius.lg};
        `
      : css`
          width: 44px;
          height: 44px;
          padding: 2px;
          border-radius: ${theme.borderRadius.md};
        `}

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
    aspect-ratio: auto;
  }
`;

const CoverImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CoverPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* Print (white) so an empty cover reads as a blank print, not cream-in-white. */
  background: ${({ theme }) => theme.color.print};
  color: ${({ theme }) => theme.color.bodyTextMuted};
`;

const Title = styled.h2<{ $mobile: boolean }>`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme, $mobile }) => ($mobile ? theme.fontSize._18 : theme.fontSize._24)};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.02em;
  line-height: 1.2;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Count = styled.p`
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  line-height: 1.4;
`;

const MobileAttribution = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CompactBrandLine = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  column-gap: ${({ theme }) => theme.spacing(1.5)};
  min-width: 0;
`;

const CompactWordmark = styled.span`
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._21};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.02em;
  line-height: 1.2;
  white-space: nowrap;
`;

const CompactLead = styled.span`
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.textAccent};
  line-height: 1.3;
  white-space: nowrap;
`;

const CompactSubline = styled.p`
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;
