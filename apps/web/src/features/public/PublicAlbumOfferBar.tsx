import { useCallback, useState } from 'react';
import styled from 'styled-components';

import { BottomSheet } from '../../ui/BottomSheet';
import { PublicOfferEmailForm } from './PublicOfferEmailForm';
import { PublicOfferIntro } from './PublicOfferIntro';

/**
 * Content height of the pinned bar, excluding its safe-area padding. The grid's scroller
 * adds this (plus the safe-area inset) to its bottom padding so the last photo row is never
 * parked permanently underneath the bar.
 */
export const PUBLIC_OFFER_BAR_HEIGHT_PX = 64;

type PublicAlbumOfferBarProps = {
  albumId: string;
  /** '' when the owner has no resolvable name — the sheet's attribution line is omitted. */
  ownerName: string;
  /**
   * Widest viewport the bar shows at; above it the host screen has a desktop offer instead.
   * The album page switches layouts at 768px (the default), the photo viewer at 968px.
   */
  mobileMaxWidthPx?: number;
};

/**
 * The mobile offer: a persistent one-line bar pinned to the viewport, which opens a bottom
 * sheet holding the same intro copy and courier email field the desktop band reveals.
 *
 * Nothing is crammed into the mobile header. The header there is already a cover, a title, a
 * count and an attribution across a phone's width; a CTA in that row would either truncate
 * the title or push the photos below the fold. A pinned bar costs one line of viewport and
 * stays reachable at any scroll position.
 *
 * The whole bar is one <button> so the tap target is the full width — a thumb aiming at
 * "Sign up" should not be able to miss it. The filled clay "Sign up" inside it is therefore a
 * styled span, not a nested button: it is there to make the bar read as pressable.
 *
 * Dismissal is the sheet primitive's: tap the scrim or drag the handle down. She can always
 * back out without submitting; submitting closes it by navigating away.
 */
export const PublicAlbumOfferBar = ({
  albumId,
  ownerName,
  mobileMaxWidthPx = 768,
}: PublicAlbumOfferBarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleClose = useCallback((): void => {
    setSheetOpen(false);
  }, []);

  return (
    <>
      <Bar
        $mobileMaxWidthPx={mobileMaxWidthPx}
        type="button"
        data-testid="public-offer-bar"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
      >
        <BarLead>A living album — join in!</BarLead>
        <BarSignUp>Sign up</BarSignUp>
      </Bar>
      <BottomSheet open={sheetOpen} onClose={handleClose} ariaLabel="Join this album">
        <SheetBody>
          <PublicOfferIntro ownerName={ownerName} />
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
const Bar = styled.button<{ $mobileMaxWidthPx: number }>`
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

  /* Desktop has its own offer — the bar is a phone-only surface. */
  @media (min-width: ${({ $mobileMaxWidthPx }) => $mobileMaxWidthPx + 1}px) {
    display: none;
  }
`;

const BarLead = styled.span`
  min-width: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.3;
`;

// Looks like the app's filled primary button; the tap target is the whole bar around it.
const BarSignUp = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 40px;
  padding: 0 ${({ theme }) => theme.spacing(2.5)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.primaryButtonText};
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.medium};
  line-height: 1.3;
  white-space: nowrap;
`;

const SheetBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2.5)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(3)}
    ${({ theme }) => theme.spacing(2)};
`;
