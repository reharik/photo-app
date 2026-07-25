import { ArrowRight } from 'lucide-react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

import { BottomSheet } from '../../ui/BottomSheet';
import { PublicOfferEmailForm } from './PublicOfferEmailForm';

/**
 * Content height of the pinned bar, excluding its safe-area padding. The grid's scroller
 * adds this (plus the safe-area inset) to its bottom padding so the last photo row is never
 * parked permanently underneath the bar.
 */
export const PUBLIC_OFFER_BAR_HEIGHT_PX = 56;

type PublicAlbumOfferBarProps = {
  albumId: string;
  /** '' when the owner has no resolvable name — the sheet's attribution line is omitted. */
  ownerName: string;
};

/**
 * The mobile offer: a persistent one-line bar pinned to the viewport, which opens a bottom
 * sheet holding the same courier email field the desktop header reveals.
 *
 * Nothing is crammed into the mobile header. The header there is already a cover, a title, a
 * count and an attribution across a phone's width; a CTA in that row would either truncate
 * the title or push the photos below the fold. A pinned bar costs one line of viewport and
 * stays reachable at any scroll position.
 *
 * The whole bar is one <button> so the tap target is the full width — a thumb aiming at
 * "Join in" in the middle of a bar should not be able to miss it.
 *
 * Dismissal is the sheet primitive's: tap the scrim or drag the handle down. She can always
 * back out without submitting; submitting closes it by navigating away.
 */
export const PublicAlbumOfferBar = ({ albumId, ownerName }: PublicAlbumOfferBarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleClose = useCallback((): void => {
    setSheetOpen(false);
  }, []);

  return (
    <>
      <Bar
        type="button"
        data-testid="public-offer-bar"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
      >
        <BarLabel>
          <BarLead>A living album</BarLead>
          <BarSeparator aria-hidden>·</BarSeparator>
          <BarJoin>Join in</BarJoin>
        </BarLabel>
        <BarArrow aria-hidden>
          <ArrowRight size={18} strokeWidth={2} />
        </BarArrow>
      </Bar>
      <BottomSheet open={sheetOpen} onClose={handleClose} ariaLabel="Join this album">
        <SheetBody>
          <SheetLead>A living album</SheetLead>
          {ownerName !== '' ? (
            <SheetAttribution>shared with you by {ownerName}</SheetAttribution>
          ) : null}
          <PublicOfferEmailForm
            albumId={albumId}
            inputId="public-offer-email-sheet"
            autoFocus
            fullWidth
          />
        </SheetBody>
      </BottomSheet>
    </>
  );
};

// Below the sheet's own scrim (z-index 200) so the scrim dims the bar too — otherwise a lit
// bar would sit on top of the dimmed grid looking like it was still the thing to tap.
const Bar = styled.button`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  min-height: ${PUBLIC_OFFER_BAR_HEIGHT_PX}px;
  margin: 0;
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  padding-bottom: calc(${({ theme }) => theme.spacing(1.5)} + env(safe-area-inset-bottom, 0px));
  /* border-box, so width:100% stays 100% of the viewport. With content-box the horizontal
     padding is ADDED to the width and the bar overflows the screen, carrying the trailing
     arrow off the right edge. */
  box-sizing: border-box;
  background: ${({ theme }) => theme.color.offerButtonBg};
  border: none;
  border-top: 1px solid ${({ theme }) => theme.color.offerButtonBorder};
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: -2px;
  }

  /* Desktop keeps its offer in the header — the bar is a phone-only surface. */
  @media (min-width: 769px) {
    display: none;
  }
`;

const BarLabel = styled.span`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing(0.75)};
  min-width: 0;
`;

const BarLead = styled.span`
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.3;
  white-space: nowrap;
`;

const BarSeparator = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  line-height: 1.3;
`;

const BarJoin = styled.span`
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.offerButtonText};
  line-height: 1.3;
  white-space: nowrap;
`;

const BarArrow = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.color.offerButtonText};
`;

const SheetBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(3)}
    ${({ theme }) => theme.spacing(2)};
`;

const SheetLead = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._18};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.3;
`;

const SheetAttribution = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(1)};
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  line-height: 1.4;
`;
