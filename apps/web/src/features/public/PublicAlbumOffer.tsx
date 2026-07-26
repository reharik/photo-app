import { useState } from 'react';
import styled from 'styled-components';

import { PublicOfferEmailForm } from './PublicOfferEmailForm';

export type PublicAlbumOfferVariant = 'full' | 'compact';

type PublicAlbumOfferProps = {
  albumId: string;
  /** '' when the owner has no resolvable name — the attribution line is then omitted. */
  ownerName: string;
  variant: PublicAlbumOfferVariant;
};

/**
 * The desktop offer: "A living album" / "shared with you by X" / a Join-in button that
 * reveals an email field IN PLACE.
 *
 * The two variants are the same offer at two densities, not two offers. `full` stacks all
 * three lines on the resting header's trailing edge; `compact` drops the lead line (the
 * collapsed header carries "A living album" on its leading edge instead, beside the
 * wordmark) and lays the rest out as one row.
 *
 * The lead and attribution lines are rendered OUTSIDE the reveal branch on purpose: when the
 * button becomes a field, the field must appear beneath copy that still says what it is for.
 * A bare input that replaced the whole block would be an unlabeled box.
 */
export const PublicAlbumOffer = ({ albumId, ownerName, variant }: PublicAlbumOfferProps) => {
  const [revealed, setRevealed] = useState(false);
  const isCompact = variant === 'compact';

  return (
    <Block $compact={isCompact} data-testid="public-offer">
      {!isCompact ? <Lead>A living album</Lead> : null}
      {ownerName !== '' ? (
        <Attribution $compact={isCompact}>
          {isCompact ? `shared by ${ownerName}` : `shared with you by ${ownerName}`}
        </Attribution>
      ) : null}
      {revealed ? (
        <PublicOfferEmailForm
          albumId={albumId}
          inputId={`public-offer-email-${variant}`}
          autoFocus
        />
      ) : (
        <JoinButton type="button" data-testid="public-offer-join" onClick={() => setRevealed(true)}>
          Join in
        </JoinButton>
      )}
    </Block>
  );
};

// `full` is a right-aligned three-line stack on the header's trailing edge; `compact` is a
// single baseline-aligned row. align-items:flex-end (not text-align) so the button and the
// revealed field — neither of which is text — hug the same right edge as the copy above.
const Block = styled.div<{ $compact: boolean }>`
  display: flex;
  min-width: 0;
  ${({ $compact, theme }) =>
    $compact
      ? `
        flex-direction: row;
        align-items: center;
        gap: ${theme.spacing(1.5)};
      `
      : `
        flex-direction: column;
        align-items: flex-end;
        text-align: right;
        gap: ${theme.spacing(0.75)};
      `}
`;

// Serif, matching the wordmark's register — this is the line that has to sound like a
// keepsake rather than a product feature.
const Lead = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._18};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.3;
  white-space: nowrap;
`;

const Attribution = styled.p<{ $compact: boolean }>`
  margin: 0;
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

// Outline-clay: a tinted-paper fill with a clay hairline, in the offer register — an
// invitation, not the app's filled primary action and not a neutral secondary.
const JoinButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 38px;
  padding: ${({ theme }) => theme.spacing(0.75)} ${({ theme }) => theme.spacing(2.5)};
  background: ${({ theme }) => theme.color.offerButtonBg};
  color: ${({ theme }) => theme.color.offerButtonText};
  border: 1px solid ${({ theme }) => theme.color.offerButtonBorder};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.color.offerButtonHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;
