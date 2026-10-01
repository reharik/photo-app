import { useState } from 'react';
import styled, { css } from 'styled-components';

import { PublicOfferEmailForm } from './PublicOfferEmailForm';
import { PublicOfferIntro } from './PublicOfferIntro';

/**
 * The desktop signup offer, in three pieces.
 *
 * - {@link PublicOfferHeaderBlock}: the collapsed state on the resting album header — a
 *   right-aligned stack ending in a filled "Sign up" button.
 * - {@link PublicOfferTeaser}: the collapsed state where there is no room for the stack —
 *   one line, "Shared by X — Join in!", plus the button. Used by the scroll-collapsed album
 *   header and (stacked) by the rail card.
 * - {@link PublicOfferBand}: the expanded state on the album page — a full-width band under
 *   the header with the intro copy and the email field, contents hugging the right edge so
 *   they sit under where the teaser was.
 * - {@link PublicOfferRailCard}: both states for the single-photo viewer's side rail, which is
 *   too narrow for either of the above.
 *
 * The button is filled clay on purpose: an outlined, muted control here read as decoration,
 * and the offer disappears for good once she has an account.
 */

type PublicOfferTeaserProps = {
  /** '' when the owner has no resolvable name — the line falls back to the album lead. */
  ownerName: string;
  onSignUp: () => void;
  /** Rail: line above a full-width button instead of one row. */
  stacked?: boolean;
};

export const PublicOfferTeaser = ({
  ownerName,
  onSignUp,
  stacked = false,
}: PublicOfferTeaserProps) => (
  <Teaser $stacked={stacked}>
    <TeaserLine $stacked={stacked}>
      {ownerName !== '' ? `Shared by ${ownerName} — Join in!` : 'A living album — join in!'}
    </TeaserLine>
    <SignUpButton type="button" data-testid="public-offer-join" onClick={onSignUp}>
      Sign up
    </SignUpButton>
  </Teaser>
);

type PublicOfferHeaderBlockProps = {
  /** '' when the owner has no resolvable name — the attribution line is then omitted. */
  ownerName: string;
  onSignUp: () => void;
};

/**
 * The collapsed offer on the RESTING album header: a right-aligned stack on the trailing
 * edge. The copy stays quiet (serif lead, muted grey lines); the filled button carries the
 * emphasis.
 */
export const PublicOfferHeaderBlock = ({ ownerName, onSignUp }: PublicOfferHeaderBlockProps) => (
  <HeaderBlock>
    <BlockLead>A living album</BlockLead>
    {ownerName !== '' ? <BlockMuted>shared with you by {ownerName}</BlockMuted> : null}
    <BlockMuted>Join in!</BlockMuted>
    <SignUpButton type="button" data-testid="public-offer-join" onClick={onSignUp}>
      Sign up
    </SignUpButton>
  </HeaderBlock>
);

type PublicOfferExpandedProps = {
  albumId: string;
  /** '' when the owner has no resolvable name — the attribution line is then omitted. */
  ownerName: string;
};

export const PublicOfferBand = ({ albumId, ownerName }: PublicOfferExpandedProps) => (
  <Band data-testid="public-offer">
    <BandInner>
      <PublicOfferIntro ownerName={ownerName} align="right" />
      <PublicOfferEmailForm albumId={albumId} inputId="public-offer-email-band" autoFocus />
    </BandInner>
  </Band>
);

export const PublicOfferRailCard = ({ albumId, ownerName }: PublicOfferExpandedProps) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <RailCard data-testid="public-offer">
      {revealed ? (
        <>
          <PublicOfferIntro ownerName={ownerName} />
          <PublicOfferEmailForm
            albumId={albumId}
            inputId="public-offer-email-rail"
            autoFocus
            fullWidth
          />
        </>
      ) : (
        <PublicOfferTeaser ownerName={ownerName} onSignUp={() => setRevealed(true)} stacked />
      )}
    </RailCard>
  );
};

// align-items:flex-end (not just text-align) so the button — which is not text — hugs the
// same right edge as the copy above it.
const HeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  gap: ${({ theme }) => theme.spacing(0.75)};
  min-width: 0;
`;

// Serif, matching the wordmark's register — this is the line that has to sound like a
// keepsake rather than a product feature.
const BlockLead = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._18};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.3;
  white-space: nowrap;
`;

const BlockMuted = styled.p`
  margin: 0;
  min-width: 0;
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Teaser = styled.div<{ $stacked: boolean }>`
  display: flex;
  min-width: 0;
  ${({ $stacked, theme }) =>
    $stacked
      ? css`
          flex-direction: column;
          align-items: stretch;
          gap: ${theme.spacing(1.5)};
        `
      : css`
          flex-direction: row;
          align-items: center;
          gap: ${theme.spacing(1.5)};
        `}
`;

// In the header the line takes the muted metadata colour the old "shared with you by" line
// had there — at full body colour it read as bold next to the title. The rail card keeps
// body colour: muted text on the tinted card would be too faint.
const TeaserLine = styled.p<{ $stacked: boolean }>`
  margin: 0;
  min-width: 0;
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme, $stacked }) => ($stacked ? theme.color.bodyText : theme.color.bodyTextMuted)};
  line-height: 1.4;
`;

const SignUpButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.primaryButtonText};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const Band = styled.section`
  flex-shrink: 0;
  width: 100%;
  background: ${({ theme }) => theme.color.offerButtonBg};
  border-bottom: 1px solid ${({ theme }) => theme.color.offerButtonBorder};
`;

// Same max-width and gutters as the header above it, so the right-aligned contents end on
// the header's own right edge.
const BandInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(2.5)} ${({ theme }) => theme.spacing(6)};
  min-width: 0;
`;

const RailCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.color.offerButtonBg};
  border: 1px solid ${({ theme }) => theme.color.offerButtonBorder};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;
